#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, join, extname, basename } from 'node:path';

const DEFAULT_IMAGES_DIR = process.env.LOCAL_QUESTOES_IMAGENS_DIR ?? 'IMAGENS CEA';
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
	const updatedQuestions = new Set();

	for (const file of files) {
		const filePath = join(imagesDir, file);
		const extension = extname(file).toLowerCase();
		const base = basename(file, extension).trim();
		const sanitized = base.replace(/^\[(.*)\]$/, '$1').trim();
		const alphanumeric = sanitized.replace(/[^0-9a-zA-Z_-]+/g, '');
		const digitsOnly = sanitized.replace(/\D+/g, '');
		const referenceCandidates = Array.from(
			new Set(
				[
					base,           // [302368] - primeiro tenta com colchetes como está no arquivo
					sanitized,      // 302368 - depois tenta sem colchetes
					alphanumeric,   // versão alfanumérica
					digitsOnly      // só números
				].filter((value) => value && value.length > 0)
			)
		);

		if (referenceCandidates.length === 0) {
			console.warn(`⚠️ Ignorando arquivo ${file} (não foi possível obter ID).`);
			continue;
		}

		const storageFolder = referenceCandidates[0].replace(/[\[\]]/g, ''); // Remove colchetes para storage
		const sanitizedFileName = `${storageFolder}${extension}`;
		let storagePath = `${storageFolder}/${sanitizedFileName}`;

		try {
			const fileBuffer = await readFile(filePath);
			const contentType =
				extension === '.png'
					? 'image/png'
					: extension === '.jpg' || extension === '.jpeg'
					? 'image/jpeg'
					: extension === '.gif'
					? 'image/gif'
					: extension === '.webp'
					? 'image/webp'
					: 'application/octet-stream';

			const { error: uploadError } = await storage.upload(storagePath, fileBuffer, {
				contentType,
				upsert: true
			});

			if (uploadError) {
				console.error(`❌ Falha ao enviar ${file}: ${uploadError.message}`);
				continue;
			}

			let questaoId = null;
			let referenciaUtilizada = null;

			for (const referencia of referenceCandidates) {
				if (!referencia) continue;

				const numericId = Number(referencia);
				if (!Number.isNaN(numericId)) {
					const { data, error } = await supabase
						.from('questoes')
						.select('id')
						.eq('id', numericId)
						.maybeSingle();

					if (!error && data) {
						questaoId = data.id;
						referenciaUtilizada = referencia;
						break;
					}
				}

				const { data, error } = await supabase
					.from('questoes')
					.select('id')
					.eq('id_questao_origem', referencia)
					.maybeSingle();

				if (!error && data) {
					questaoId = data.id;
					referenciaUtilizada = referencia;
					break;
				}
			}

			if (questaoId) {
				if (!updatedQuestions.has(questaoId)) {
					const payloadAtualizacao = {
						ha_imagem: true,
						id_questao_origem: storageFolder
					};

					const { error: updateError } = await supabase
						.from('questoes')
						.update(payloadAtualizacao)
						.eq('id', questaoId);

					if (updateError) {
						console.warn(
							`⚠️ Imagem ${file} enviada, mas falhou ao atualizar questoes (id=${questaoId}): ${updateError.message}`
						);
					} else {
						updatedQuestions.add(questaoId);
					}
				}
			} else {
				console.warn(
					`⚠️ Imagem ${file} enviada, mas não encontrei questão com id/id_questao_origem em ${referenceCandidates.join(', ')}.`
				);
			}

			console.log(`✅ ${file} → ${storagePath}`);
		} catch (error) {
			console.error(`❌ Erro ao processar ${file}:`, error);
		}
	}

	console.log(`✨ Sincronização concluída. Questões atualizadas: ${updatedQuestions.size}`);
})();
