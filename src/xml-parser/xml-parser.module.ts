import { Module, Logger } from '@nestjs/common';
import { XmlParserService } from './services/xml-parser.service';

@Module({
  providers: [XmlParserService, Logger],
  exports: [XmlParserService],
})
export class XmlParserModule {}
