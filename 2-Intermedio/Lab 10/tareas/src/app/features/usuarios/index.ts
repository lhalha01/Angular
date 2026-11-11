// API pública de la feature `usuarios`: lo único que otras features pueden importar.
export { UserService } from './services/user.service';
export { isUser } from './models/user.model';
export type { User, UserDraft } from './models/user.model';
