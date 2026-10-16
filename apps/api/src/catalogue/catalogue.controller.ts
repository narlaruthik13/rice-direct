import { Controller, Get, Module, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import {
  BatchIdSchema,
  type CategorySummary,
  type ProductDetailResponse,
  type ProductListQuery,
  ProductListQuerySchema,
  type ProductListResponse,
  ProductSlugSchema,
  type TraceResponse,
} from "@kisa/shared";
import { ZodValidationPipe } from "../common/zod";
import { CatalogueService } from "./catalogue.service";

/** Public, read-only catalogue for the website. */
@ApiTags("catalogue")
@Controller()
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Get("categories")
  @ApiOperation({ summary: "Active categories with their business settings." })
  categories(): Promise<CategorySummary[]> {
    return this.catalogue.categories();
  }

  @Get("products")
  @ApiOperation({
    summary: "Products with their farmers and partners. Expired perishable batches are hidden; onions are oldest batch first.",
  })
  @ApiQuery({ name: "category", required: false, example: "onions" })
  @ApiQuery({ name: "salesModel", required: false, enum: ["FARMER_OWNED", "PARTNER_SOURCED"] })
  @ApiQuery({ name: "inStock", required: false, enum: ["true", "false"] })
  products(@Query(new ZodValidationPipe(ProductListQuerySchema)) query: ProductListQuery): Promise<ProductListResponse> {
    return this.catalogue.products(query);
  }

  @Get("products/:slug")
  @ApiOperation({ summary: "One product with its batch, farmer and partner." })
  product(@Param("slug", new ZodValidationPipe(ProductSlugSchema)) slug: string): Promise<ProductDetailResponse> {
    return this.catalogue.product(slug);
  }

  @Get("trace/:batchId")
  @ApiOperation({ summary: "What a pack's QR code opens: batch, farmer, partner and packs." })
  trace(@Param("batchId", new ZodValidationPipe(BatchIdSchema)) batchId: string): Promise<TraceResponse> {
    return this.catalogue.trace(batchId);
  }
}

@Module({ controllers: [CatalogueController], providers: [CatalogueService] })
export class CatalogueModule {}
