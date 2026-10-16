import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditService } from "./audit";
import { BatchesController, BatchesService } from "./batches";
import { MillsController, MillsService } from "./mills";
import { VarietiesController, VarietiesService } from "./varieties";

/** Admin management of mills, varieties, batches, products and stock. */
@Module({
  imports: [AuthModule],
  controllers: [MillsController, VarietiesController, BatchesController],
  providers: [AuditService, MillsService, VarietiesService, BatchesService],
})
export class AdminCatalogueModule {}
