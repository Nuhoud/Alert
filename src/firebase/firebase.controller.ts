import { Controller } from '@nestjs/common';
import { FcmService } from './firebase.service';

@Controller('firebase')
export class FirebaseController {
  constructor(private readonly fcmService: FcmService) {}
}
