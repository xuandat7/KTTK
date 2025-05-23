import { Logger } from '@nestjs/common';
import { MLCommand } from './ml-command.interface';

export class MLInvoker {
  private readonly logger = new Logger(MLInvoker.name);

  async run(command: MLCommand): Promise<any> {
    this.logger.log(`Executing command: ${command.constructor.name}`);
    const result = await command.execute();
    this.logger.log(`Command executed successfully: ${command.constructor.name}`);
    return result;
  }
}