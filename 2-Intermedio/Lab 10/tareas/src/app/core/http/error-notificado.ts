/**
 * Manejador de `error` para las suscripciones cuyo fallo ya avisa el interceptor de errores: evita que RxJS lo
 * trate como un error sin capturar, sin duplicar el aviso en el componente. Los componentes no gestionan los
 * errores HTTP; solo dejan claro que no hay nada más que hacer (el formulario se queda como está para reintentar).
 */
export const errorYaNotificado = (): void => undefined;
