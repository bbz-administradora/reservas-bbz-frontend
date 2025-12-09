/**
 * Opções para personalização dos erros.
 *
 * @interface CustomErrorOptions
 * @property {string} [message] - Mensagem descritiva do erro.
 * @property {string} [action] - Ação recomendada para resolução do erro.
 * @property {any} [details] - Detalhes adicionais sobre o erro.
 */
export interface CustomErrorOptions {
  message?: string
  action?: string
  details?: any
}

/**
 * Classe Custom para erros HTTP personalizados.
 *
 * @class CustomError
 * @extends Error
 *
 * @param {number} statusCode - HTTP Status Code do erro.
 * @param {string} defaultMessage - Mensagem padrão do erro.
 * @param {string} defaultAction - Ação padrão recomendada para o erro.
 * @param {CustomErrorOptions} [options] - Opções para sobrescrever os valores padrão.
 */
export class CustomError extends Error {
  public name: string
  public statusCode: number
  public action: string
  public details?: any

  constructor(
    statusCode: number,
    name: string,
    defaultMessage: string,
    defaultAction: string,
    options?: CustomErrorOptions,
  ) {
    const message = options?.message ?? defaultMessage
    super(message)
    this.name = name
    this.statusCode = statusCode
    this.action = options?.action ?? defaultAction
    this.details = options?.details

    Object.setPrototypeOf(this, new.target.prototype)
  }

  /**
   * Converte o erro para o formato JSON.
   *
   * @returns {object} Objeto com os detalhes do erro.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
      details: this.details,
    }
  }

  /**
   * Getter para o código de status HTTP.
   * @return {number} Código de status HTTP.
   * (mantém compatibilidade com o Orval Error)
   */
  get status_code() {
    return this.statusCode
  }
}
