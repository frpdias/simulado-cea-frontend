#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, join, extname, basename } from 'node:path';

const DEFAULT_IMAGES_DIR = process.env.LOCAL_QUESTOES_IMAGENS_DIR ?? 'extrair_simulados/imagens';
const BUCKET = process.env.QUESTOES_IMAGENS_BUCKET ?? 'questoes-images';

function loadEnv() {
	const possible = ['.env.local', '.env'];
	for (const file of possible) {
		const path = resolve(process.cwd(), file);
		if (!existsSync(path)) continue;
		try {
			const raw = readFileSync(path, 'utf8');
			for (const line of raw.split(/\r?\n/)) {
				const trimmed = line.trim();
				if (!trimmed || trimmed.startsWith('#')) continue;
				const idx = trimmed.indexOf('=');
				if (idx === -1) continue;
				const key = trimmed.slice(0, idx).trim();
				const value = trimmed.slice(idx + 1).trim();
				if (!(key in process.env)) {
					process.env[key] = value;
				}
			}
		} catch (error) {
			console.warn(`⚠️ Não foi possível ler ${path}:`, error.message);
		}
	}
}

await (async () => {
	loadEnv();

	const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
	const serviceKey =
		process.env.SUPABASE_SERVICE_ROLE_KEY ??
		process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
		'';

	if (!supabaseUrl || !serviceKey) {
		console.error('❌ Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
		process.exit(1);
	}

	const supabase = createClient(supabaseUrl, serviceKey, {
		auth: { persistSession: false }
	});

	const imagesDir = resolve(process.cwd(), DEFAULT_IMAGES_DIR);
	if (!existsSync(imagesDir)) {
		console.error(`❌ Diretório de imagens não encontrado: ${imagesDir}`);
		process.exit(1);
	}

	const files = (await readdir(imagesDir)).filter((file) => {
		const filePath = join(imagesDir, file);
		const stats = statSync(filePath);
		if (!stats.isFile()) return false;
		const ext = extname(file).toLowerCase();
		return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
	});

	if (files.length === 0) {
		console.log('ℹ️ Nenhum arquivo de imagem encontrado no diretório local.');
		return;
	}

	console.log(`🚀 Iniciando sincronização de ${files.length} imagens para o bucket ${BUCKET}...`);

	const storage = supabase.storage.from(BUCKET);
	let sucessos = 0;
	let falhas = 0;

	for (const file of files) {
		const filePath = join(imagesDir, file);
		const extension = extname(file).toLowerCase();
		const base = basename(file, extension).trim();
		
		// O nome do arquivo é [302368] ou [104217-A] - manter essa referência para buscar no banco
		const idOriginal = base;
		
		// Para o storage, remover colchetes (Supabase não aceita)
		const idStorage = base.replace(/[\[\]]/g, '');
		const storagePath = `${idStorage}/${idStorage}${extension}`;

		try {
			console.log(`📤 Enviando ${file}...`);
			
			// Upload da imagem
			const fileBuffer = await readFile(filePath);
			const contentType =
				extension === '.png' ? 'image/png' :
				extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' :
				extension === '.gif' ? 'image/gif' :
				extension === '.webp' ? 'image/webp' :
				'application/octet-stream';

			const { error: uploadError } = await storage.upload(storagePath, fileBuffer, {
				contentType,
				upsert: true
			});

			if (uploadError) {
				console.error(`❌ Falha ao enviar ${file}: ${uploadError.message}`);
				falhas++;
				continue;
			}

			// Buscar questão no banco - tentar com e sem colchetes
			let questao = null;
			let searchError = null;
			
			// Primeiro tentar com colchetes
			const result1 = await supabase
				.from('questoes')
				.select('id')
				.eq('id_questao_origem', idOriginal)
				.maybeSingle();
			
			if (!result1.error && result1.data) {
				questao = result1.data;
			} else {
				// Tentar sem colchetes
				const idSemColchetes = idOriginal.replace(/[\[\]]/g, '');
				const result2 = await supabase
					.from('questoes')
					.select('id')
					.eq('id_questao_origem', idSemColchetes)
					.maybeSingle();
				
				if (!result2.error && result2.data) {
					questao = result2.data;
				} else {
					searchError = result2.error || result1.error;
				}
			}

			if (searchError) {
				console.error(`❌ Erro ao buscar questão para ${idOriginal}: ${searchError.message}`);
				falhas++;
				continue;
			}

			if (!questao) {
				console.warn(`⚠️ Questão não encontrada para ${idOriginal} (testado com e sem colchetes)`);
				falhas++;
				continue;
			}

			// Atualizar questão com URL da imagem
			const { data } = storage.getPublicUrl(storagePath);
			const { error: updateError } = await supabase
				.from('questoes')
				.update({ 
					ha_imagem: true,
					url_imagem: data.publicUrl 
				})
				.eq('id', questao.id);

			if (updateError) {
				console.error(`❌ Erro ao atualizar questão ${questao.id}: ${updateError.message}`);
				falhas++;
				continue;
			}

			console.log(`✅ ${file} → ${data.publicUrl}`);
			sucessos++;

		} catch (error) {
			console.error(`❌ Erro ao processar ${file}:`, error);
			falhas++;
		}
	}

	console.log(`\n✨ Sincronização concluída!`);
	console.log(`✅ Sucessos: ${sucessos}`);
	console.log(`❌ Falhas: ${falhas}`);
})();