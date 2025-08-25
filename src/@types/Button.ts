import { ButtonInteraction, CacheType, InteractionCollector, Message } from "discord.js";
import { Manager } from "../manager.js";
import { ZkslinkPlayer } from "../zklink/main.js";

export class PlayerButton {
  name: string = "";
  accessableby: string = "";

  /**
   * Xử lý tương tác nút.
   * @param client - Thể hiện Manager của bot.
   * @param message - Tin nhắn tương tác nút.
   * @param language - Ngôn ngữ sử dụng cho phản hồi.
   * @param player - Thể hiện Zkslink player liên quan đến tương tác.
   * @param nplaying - Tin nhắn hiển thị bản nhạc đang phát.
   * @param collector - Bộ thu tương tác cho tương tác nút.
   * @returns Một promise hoàn thành khi xử lý tương tác xong.
   */

  async run(
    client: Manager,
    message: ButtonInteraction,
    language: string,
    player: ZkslinkPlayer,
    nplaying: Message,
    collector: InteractionCollector<ButtonInteraction<"cached">>
  ): Promise<any> {}
}