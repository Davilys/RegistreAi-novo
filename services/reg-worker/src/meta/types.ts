export type MediaKind="audio"|"image"|"document";
export type Inbound={kind:"message";phoneNumberId:string;wabaId?:string;waId:string;wamid:string;timestamp:string;messageType:"text"|MediaKind|"interactive"|"button"|"unsupported";text?:string;media?:{id:string;mimeType?:string;sha256?:string;filename?:string;caption?:string;voice?:boolean};replyToWamid?:string};
export type Status={kind:"status";phoneNumberId:string;wabaId?:string;wamid:string;recipientWaId?:string;status:"sent"|"delivered"|"read"|"failed"|"played"|"unknown";timestamp?:string;errors:unknown[]};
export type Event=Inbound|Status;
