export interface EmailRequest {
    to: string;
    subject: string;
    html: string;
}
  
export interface EmailResponse {
    ok: boolean;
    message: string;
}