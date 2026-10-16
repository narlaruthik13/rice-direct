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
  RICE_AGES,
  RICE_TYPES,
  type TraceResponse,
  type Variety,
} from "@kisa/shared";
import { ZodValidationPipe } from "../common/zod";
import { CatalogueService } from "./catalogue.service";

/** Public, read-only catalogue for the website. Never includes mills or the price split. */
@ApiTags("catalogue")
@Controller()
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Get("categories")
  @ApiOperation({ summary: "Active categories (rice today) with their pack sizes." })
  categories(): Promise<CategorySummary[]> {
    return this.catalogue.categories();
  }

  @Get("varieties")
  @ApiOperation({ summary: "Active varieties, for the shop's variety filter." })
  varieties(): Promise<Variety[]> {
    return this.catalogue.varieties();
  }

  @Get("products")
  @ApiOperation({ summary: "Products on sale (before best-before). One total price per pack." })
  @ApiQuery({ name: "category", required: false, example: "rice" })
  @ApiQuery({ name: "riceType", required: false, enum: RICE_TYPES })
  @ApiQuery({ name: "variety", required: false, example: "sona-masoori" })
  @ApiQuery({ name: "age", required: false, enum: RICE_AGES })
  @ApiQuery({ name: "packSize", required: false, example: 10 })
  @ApiQuery({ name: "inStock", required: false, enum: ["true", "false"] })
  products(@Query(new ZodValidationPipe(ProductListQuerySchema)) query: ProductListQuery): Promise<ProductListResponse> {
    return this.catalogue.products(query);
  }

  @Get("products/:slug")
  @ApiOperation({ summary: "One product with its batch's Quality Passport." })
  product(@Param("slug", new ZodValidationPipe(ProductSlugSchema)) slug: string): Promise<ProductDetailResponse> {
    return this.catalogue.product(slug);
  }

  @Get("trace/:batchId")
  @ApiOperation({ summary: "The Quality Passport a bag's QR code opens: variety, type, dates and quality report." })
  trace(@Param("batchId", new ZodValidationPipe(BatchIdSchema)) batchId: string): Promise<TraceResponse> {
    return this.catalogue.trace(batchId);
  }
}

@Module({ controllers: [CatalogueController], providers: [CatalogueService] })
export class CatalogueModule {}
