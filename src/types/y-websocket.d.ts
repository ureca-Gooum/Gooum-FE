declare module "y-websocket" {
    import { Doc } from "yjs";
    import { Awareness } from "y-protocols/awareness";

    export class WebsocketProvider {
        awareness: Awareness;
        constructor(serverUrl: string, roomname: string, doc: Doc);
        destroy(): void;
    }
}
