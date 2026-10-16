import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditService } from "./audit";
import { BatchesController, BatchesService } from "./batches";
import { FarmersController, FarmersService } from "./farmers";
import { PartnersController, PartnersService } from "./partners";

/** Admin management of farmers, partners, batches, products and stock (step 5). */
@Module({
  imports: [AuthModule],
  controllers: [FarmersController, PartnersController, BatchesController],
  providers: [AuditService, FarmersService, PartnersService, BatchesService],
})
export class AdminCatalogueModule {}
