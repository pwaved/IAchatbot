import Usuario from '../models/usuario_model.js';
import Perfil from '../models/perfil_model.js';
import models from '../models/index.js';

class AdminController {
  // lista usuarios nao registrados
  async getPendingUsers(req, res) {
    try {
      const pendingUsers = await Usuario.findAll({
        where: { aprovado: false },
        attributes: ['id', 'nome', 'email'],
        include: {
          model: Perfil,
          as: 'Perfils',
          through: { attributes: [] },
          attributes: ['nome_perfil']
        }
      });
      return res.status(200).json(pendingUsers);
    } catch (error) {
      console.error('Erro ao buscar usuários pendentes:', error);
      return res.status(500).json({ error: 'Falha ao buscar usuários pendentes.', details: error.message });
    }
  }

  // aprova o usuario
  async approveUser(req, res) {
    const { id } = req.params; // User ID
    const { perfilId } = req.body;

    const t = await models.sequelize.transaction();

    try {
      const user = await Usuario.findByPk(id, { transaction: t });
      if (!user) {
        await t.rollback();
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      if (user.aprovado) {
        await t.rollback();
        return res.status(400).json({ error: 'Usuário já aprovado.' });
      }

      // aprova o usuario
      user.aprovado = true;
      await user.save({ transaction: t });

      // adiciona um perfil ao usuario
      if (perfilId) {
        const perfil = await Perfil.findByPk(perfilId, { transaction: t });
        if (perfil) {
          // Remove perfil existente e adiciona um novo, ou so adiciona se necessario 
          await user.setPerfils([perfil], { transaction: t }); // setProfile para atualizar
        } else {
          console.warn(`Perfil com ID ${perfilId} não encontrado para atribuir ao usuário ${id}.`);
        }
      }

      await t.commit();
      return res.status(200).json({ message: 'Usuário aprovado com sucesso!', user: { id: user.id, nome: user.nome, email: user.email, aprovado: user.aprovado } });

    } catch (error) {
      await t.rollback();
      console.error('Erro ao aprovar usuário:', error);
      return res.status(500).json({ error: 'Falha ao aprovar usuário.', details: error.message });
    }
  }

  // Rejeita o cadastro
  async rejectUser(req, res) {
    const { id } = req.params;

    try {
      const user = await Usuario.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      if (user.aprovado) {
        return res.status(400).json({ error: 'Usuário já aprovado. Não pode ser rejeitado por este método.' });
      }

      await user.destroy(); // deleta da DB
      return res.status(200).json({ message: 'Usuário pendente rejeitado/removido com sucesso.' });

    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
      return res.status(500).json({ error: 'Falha ao rejeitar usuário.', details: error.message });
    }
  }
}

export default new AdminController();