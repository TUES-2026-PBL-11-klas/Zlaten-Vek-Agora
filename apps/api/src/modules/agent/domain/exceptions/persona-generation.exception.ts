import { AppException } from './app.exception';

export class PersonaGenerationException extends AppException {
  constructor(reason: string) {
    super(`Persona generation failed: ${reason}`, 422, 'PERSONA_GENERATION_FAILED');
  }
}
