export const ApiConfig: IApiConfig = {
  kahootApiHost: 'https://kahoot.it',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.112 Safari/537.36'
}

export interface IApiConfig {
  kahootApiHost: string;
  userAgent: string;
}