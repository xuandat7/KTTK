import { MLCommand } from './ml-command.interface';

export class MLInvoker {
  async run(command: MLCommand): Promise<any> {
    return await command.execute();
  }
}