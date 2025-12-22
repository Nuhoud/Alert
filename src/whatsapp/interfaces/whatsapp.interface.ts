export interface MessageRequest {
    mobileNumber: string;
    message: string;
}
  
export interface MessageResponse {
    ok: boolean;
    message: string;
}