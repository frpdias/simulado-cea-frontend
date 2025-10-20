import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export const POST = async (event: RequestEvent) => {
	try {
		const supabase = event.locals.supabase;
		
		const { data: { session }, error: sessionError } = await supabase.auth.getSession();
		
		if (sessionError) {
			return json({ error: 'Erro ao obter sessão', details: sessionError.message }, { status: 500 });
		}
		
		if (!session) {
			return json({ error: 'Usuário não autenticado' }, { status: 401 });
		}
		
		const user = session.user;
		
		// Verificar se já existe na tabela usuarios
		const { data: existingUser, error: fetchError } = await supabase
			.from('usuarios')
			.select('*')
			.eq('id', user.id)
			.single();
		
		if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
			return json({ error: 'Erro ao buscar usuário', details: fetchError.message }, { status: 500 });
		}
		
		if (existingUser) {
			// Atualizar usuário existente para admin
			const { error: updateError } = await supabase
				.from('usuarios')
				.update({ papel: 'admin' })
				.eq('id', user.id);
			
			if (updateError) {
				return json({ error: 'Erro ao atualizar usuário', details: updateError.message }, { status: 500 });
			}
			
			return json({ message: 'Usuário promovido a admin com sucesso!', action: 'updated' });
		} else {
			// Criar novo usuário como admin
			const { error: insertError } = await supabase
				.from('usuarios')
				.insert({
					id: user.id,
					email: user.email,
					nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Admin',
					whatsapp: user.user_metadata?.whatsapp,
					papel: 'admin',
					status: 'ativo'
				});
			
			if (insertError) {
				return json({ error: 'Erro ao criar usuário admin', details: insertError.message }, { status: 500 });
			}
			
			return json({ message: 'Usuário criado como admin com sucesso!', action: 'created' });
		}
		
	} catch (err) {
		console.error('❌ Erro no make-admin:', err);
		return json({ error: 'Erro interno', details: String(err) }, { status: 500 });
	}
};