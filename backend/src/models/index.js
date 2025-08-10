import { sequelize } from '../config/database.js';
import { SessionModel as Sessions } from '../config/database.js';
// import dos modelos
import Usuario from './usuario_model.js';
import Perfil from './perfil_model.js';
import Categoria from './categoria_model.js';
import Subcategoria from './subcategoria_model.js';
import Documento from './documento_model.js';
import PalavraChave from './palavrachave_model.js';
import ChatSessao from './chatSessao_model.js';
import ChatConsulta from './chatConsulta_model.js';
import ChatResposta from './chatResposta_model.js';
import Feedback from './feedback_model.js';
import AssuntoPendente from './assuntoPendente_model.js';
import DocumentoParagrafoEmbedding from './documento_paragrafo_embedding_model.js';
import Permissao from './permissao_model.js';
import CacheRespostas from './cache_respostas.js';
// cria um objeto para os modelos
const models = {
  Usuario,
  Perfil,
  Categoria,
  Subcategoria,
  Documento,
  PalavraChave,
  ChatSessao,
  ChatConsulta,
  ChatResposta,
  Feedback,
  AssuntoPendente,
  DocumentoParagrafoEmbedding,
  Permissao,
  Sessions,
  CacheRespostas
};

// --- Associações ---
// --- Usuario <-> Sessions ---


// Relação N-para-N: Usuario <-> Perfil
Usuario.belongsToMany(Perfil, { through: 'usuario_perfis', foreignKey: 'usuario_id', otherKey: 'perfil_id', timestamps: false, as: 'Perfils' });
Perfil.belongsToMany(Usuario, { through: 'usuario_perfis', foreignKey: 'perfil_id', otherKey: 'usuario_id', timestamps: false, as: 'Usuarios' });

// ---  ASSOCIAÇÃO N-para-N: Perfil <-> Permissao ---
Perfil.belongsToMany(Permissao, { through: 'perfil_permissoes', foreignKey: 'perfil_id', otherKey: 'permissao_id',as: 'permissoes', timestamps: false });
Permissao.belongsToMany(Perfil, { through: 'perfil_permissoes',  foreignKey: 'permissao_id', otherKey: 'perfil_id',as: 'perfis', timestamps: false });

// Relação 1-para-N: Categoria -> Subcategoria
Categoria.hasMany(Subcategoria, { as: 'subcategorias', foreignKey: 'categoria_id' });
Subcategoria.belongsTo(Categoria, { as: 'categoria', foreignKey: 'categoria_id' });

// Relação 1-para-N: Subcategoria -> Documento
Subcategoria.hasMany(Documento, { as: 'documentos', foreignKey: 'subcategoria_id' });
Documento.belongsTo(Subcategoria, { as: 'subcategoria', foreignKey: 'subcategoria_id' });

// Relação 1-para-N: Usuario (como Autor) -> Documento
Usuario.hasMany(Documento, { as: 'documentos_criados', foreignKey: 'autor_id' });
Documento.belongsTo(Usuario, { as: 'autor', foreignKey: 'autor_id' });

// Relação N-para-N: Documento <-> PalavraChave
Documento.belongsToMany(PalavraChave, { through: 'documentos_palavras_chaves', foreignKey: 'documento_id', otherKey: 'tag_id', timestamps: false });
PalavraChave.belongsToMany(Documento, { through: 'documentos_palavras_chaves', foreignKey: 'tag_id', otherKey: 'documento_id', timestamps: false });

// Relação 1-para-N: Documento -> DocumentoEmbedding
Documento.hasMany(DocumentoParagrafoEmbedding, { foreignKey: 'documento_id', as: 'paragrafos' });
DocumentoParagrafoEmbedding.belongsTo(Documento, { foreignKey: 'documento_id' });


// Relação 1-para-N: Usuario -> ChatSessao
Usuario.hasMany(ChatSessao, { foreignKey: 'usuario_id' });
ChatSessao.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Relação 1-para-N: ChatSessao -> ChatConsulta
ChatSessao.hasMany(ChatConsulta, { foreignKey: 'sessao_id' });
ChatConsulta.belongsTo(ChatSessao, { foreignKey: 'sessao_id' });

// Relação 1-para-1: ChatConsulta <-> ChatResposta
ChatConsulta.hasOne(ChatResposta, { as: 'chatResposta', foreignKey: 'consulta_id' }); 
ChatResposta.belongsTo(ChatConsulta, { foreignKey: 'consulta_id' });

// Relação 1-para-1: ChatConsulta <-> Feedback
ChatConsulta.hasOne(Feedback, { as: 'feedback', foreignKey: 'consulta_id' });
Feedback.belongsTo(ChatConsulta, { foreignKey: 'consulta_id' });

// Relação 1-para-1: ChatConsulta <-> AssuntoPendente
ChatConsulta.hasOne(AssuntoPendente, { foreignKey: 'consulta_id' });
AssuntoPendente.belongsTo(ChatConsulta, { foreignKey: 'consulta_id' });

// Relação N-para-1: Documento -> ChatResposta
Documento.hasMany(ChatResposta, { foreignKey: 'documento_fonte_id' });
ChatResposta.belongsTo(Documento, { as: 'documento_fonte', foreignKey: 'documento_fonte_id' });

// Relação N-para-1: Categoria -> AssuntoPendente
Categoria.hasMany(AssuntoPendente, { foreignKey: 'categoria_id', as: 'assuntos_pendentes' });
AssuntoPendente.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria_sugerida' });

// Relação N-para-1: Subcategoria -> AssuntoPendente
Subcategoria.hasMany(AssuntoPendente, { foreignKey: 'subcategoria_id', as: 'assuntos_pendentes' });
AssuntoPendente.belongsTo(Subcategoria, { foreignKey: 'subcategoria_id', as: 'subcategoria_sugerida' });

// Exporta os modelos e a instância do Sequelize
models.sequelize = sequelize;

export default models;
