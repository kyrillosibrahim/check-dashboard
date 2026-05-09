import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { IProduct, IProductVariant } from '../../../../core/models/product.model';
import { ICategory, ISubcategory } from '../../../../core/models/category.model';
import { IBrand } from '../../../../core/models/brand.model';
import { IMerchant } from '../../../../core/models/merchant.model';
import { ProductService } from '../../../../core/services/product.service';
import { ImageUploaderComponent } from '../image-uploader/image-uploader.component';
import { PriceCalculatorComponent } from '../price-calculator/price-calculator.component';
import { OffersEditorComponent, IOffer } from '../offers-editor/offers-editor.component';
import { RichTextEditorComponent } from '../rich-text-editor/rich-text-editor.component';
import { FaqEditorComponent, IFaqItem } from '../faq-editor/faq-editor.component';
import { ComparisonSitesEditorComponent } from '../comparison-sites-editor/comparison-sites-editor.component';
import { IComparisonSite } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, ImageUploaderComponent, PriceCalculatorComponent, OffersEditorComponent, RichTextEditorComponent, FaqEditorComponent, ComparisonSitesEditorComponent],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductFormComponent implements OnInit, OnChanges {
  @Input() product: IProduct | null = null;
  @Input() categories: ICategory[] = [];
  @Input() brands: IBrand[] = [];
  @Input() merchants: IMerchant[] = [];
  /** Hide the "تفاصيل المنتج" accordion (used for wholesale-offer modal). */
  @Input() hideDetails = false;
  /** Hide the main product images uploader (used for wholesale-offer modal). */
  @Input() hideMainImages = false;
  /** Hide the slider images uploader (used for wholesale-offer modal). */
  @Input() hideSliderImages = false;
  /** Show the minimum-quantity input next to the wholesale price. */
  @Input() showMinWholesaleQuantity = false;
  /** Hide the SEO accordion (used for wholesale-offer modal). */
  @Input() hideSeo = false;
  /** Hide the FAQ accordion (used for wholesale-offer modal). */
  @Input() hideFaq = false;
  /** Show the "offer bundle" accordion with offerPiecesCount + offerPrice (wholesale-only). */
  @Input() showOfferBundle = false;
  @Output() save = new EventEmitter<IProduct>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  generatedSlug = '';

  /** Accordion panel open/close state */
  panels: Record<string, boolean> = {
    basicInfo: true,
    description: false,
    pricing: false,
    images: false,
    variants: false,
    offers: false,
    offerBundle: false,
    faq: false,
    seo: false,
    details: false,
    comparisons: false
  };

  /** Available variant option types shown in the dropdown */
  variantTypeOptions: { value: NonNullable<IProduct['variantOptionType']>; labelAr: string }[] = [
    { value: 'size',   labelAr: 'مقاس' },
    { value: 'type',   labelAr: 'نوع' },
    { value: 'volume', labelAr: 'حجم' },
    { value: 'color',  labelAr: 'لون' },
    { value: 'model',  labelAr: 'موديل' }
  ];

  /** Per-variant image arrays parallel to the variants FormArray index */
  variantsMainImages: string[][] = [];
  variantsNaturalImages: string[][] = [];

  /** Language tab for description editor */
  descLang: 'ar' | 'en' = 'ar';

  togglePanel(key: string): void {
    this.panels[key] = !this.panels[key];
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-populate category-dependent fields when categories arrive (async load)
    if (changes['categories'] && this.categories.length && this.product?.category && this.form) {
      const cat = this.categories.find(c => c.slug === this.product!.category);
      this.filteredSubcategories = cat?.subcategories || [];
      this.filteredBrands = cat?.famousBrands?.length ? cat.famousBrands as unknown as IBrand[] : this.brands;
      this.filteredFilterTags = cat?.filterTags || [];
      this.selectedFilterTags = [...(this.product!.filterTags || [])];
      // Restore subcategory value without triggering valueChanges reset
      if (this.product!.subcategory) {
        this.form.get('subcategory')!.setValue(this.product!.subcategory, { emitEvent: false });
      }
      this.cdr.markForCheck();
    }
  }

  mainImages: string[] = [];
  swiperImages: string[] = [];
  realImages: string[] = [];
  offers: IOffer[] = [];
  faqs: IFaqItem[] = [];
  comparisonSites: IComparisonSite[] = [];

  /** Subcategories of the currently selected category */
  filteredSubcategories: ISubcategory[] = [];
  /** Brands filtered by selected category's famousBrands */
  filteredBrands: IBrand[] = [];
  /** Filter tags available from the selected category */
  filteredFilterTags: string[] = [];
  /** Filter tags selected for this product */
  selectedFilterTags: string[] = [];

  get isEdit(): boolean {
    return !!this.product;
  }

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    const detailsValidators = this.hideDetails ? [] : [Validators.required];
    const stockValidators = this.hideDetails ? [Validators.min(0)] : [Validators.required, Validators.min(0)];
    this.form = this.fb.group({
      title: [this.product?.title || '', [Validators.required, Validators.minLength(3)]],
      titleAr: [this.product?.titleAr || ''],
      description: [this.product?.description || ''],
      descriptionAr: [this.product?.descriptionAr || ''],
      descriptionHtml: [this.product?.descriptionHtml || this.product?.description || ''],
      descriptionHtmlAr: [this.product?.descriptionHtmlAr || this.product?.descriptionAr || ''],
      wholesalePrice: [this.product?.wholesalePrice || 0, [Validators.required, Validators.min(0)]],
      minWholesaleQuantity: [this.product?.minWholesaleQuantity || 0, [Validators.min(0)]],
      offerPiecesCount: [this.product?.offerPiecesCount || 0, [Validators.min(0)]],
      offerPrice: [this.product?.offerPrice || 0, [Validators.min(0)]],
      originalPrice: [this.product?.originalPrice || this.product?.price || 0, [Validators.required, Validators.min(0.01)]],
      discountedPrice: [this.product?.discountedPrice || 0, [Validators.required, Validators.min(0)]],
      category: [this.product?.category || '', detailsValidators],
      subcategory: [this.product?.subcategory || ''],
      brand: [this.product?.brand || '', detailsValidators],
      merchant: [this.product?.merchant || ''],
      stock: [this.product?.stock ?? 100, stockValidators],
      rating: [this.product?.rating || 0, [Validators.min(0), Validators.max(5)]],
      isFeatured: [this.product?.isFeatured || false],
      comingSoon: [this.product?.comingSoon || false],
      metaTitle: [this.product?.metaTitle || ''],
      metaDescription: [this.product?.metaDescription || ''],
      seoKeywords: [this.product?.seoKeywords?.join(', ') || ''],
      hasVariants: [this.product?.hasVariants || false],
      variantOptionType: [this.product?.variantOptionType || ''],
      baseVariantNameAr: [this.product?.baseVariantNameAr || ''],
      variants: this.fb.array([])
    });

    if (this.product) {
      this.mainImages = [...(this.product.images || [])];
      this.swiperImages = [...(this.product.swiperImages || [])];
      this.realImages = [...(this.product.naturalImages || [])];
      this.offers = [...(this.product.offers || [])];
      this.faqs = (this.product.faq || []).map(f => ({ ...f }));
      this.comparisonSites = (this.product.comparisonSites || []).map(s => ({ ...s }));

      // Hydrate variants
      if (this.product.variants?.length) {
        for (const v of this.product.variants) {
          this.pushVariant(v);
        }
      }

      // If hasVariants is true, open the panel by default
      if (this.product.hasVariants) {
        this.panels['variants'] = true;
      }
    }

    if (this.product?.slug) {
      this.generatedSlug = this.product.slug;
    } else {
      // Only auto-generate slug in add mode (not edit)
      this.form.get('title')!.valueChanges.subscribe(title => {
        this.generatedSlug = this.productService.generateSlug(title || '');
      });
      if (this.product?.title) {
        this.generatedSlug = this.productService.generateSlug(this.product.title);
      }
    }

    // Listen to category changes to update subcategories, brands, and filter tags
    this.form.get('category')!.valueChanges.subscribe(slug => {
      const cat = this.categories.find(c => c.slug === slug);
      this.filteredSubcategories = cat?.subcategories || [];
      this.filteredBrands = cat?.famousBrands?.length ? cat.famousBrands as unknown as IBrand[] : this.brands;
      this.filteredFilterTags = cat?.filterTags || [];
      this.selectedFilterTags = [];
      this.form.get('subcategory')!.setValue('');
      // Only reset brand if current value isn't in the new filtered list
      const currentBrand = this.form.get('brand')!.value;
      if (currentBrand && !this.filteredBrands.some(b => b.name === currentBrand)) {
        this.form.get('brand')!.setValue('');
      }
    });

    // Populate subcategories, brands, and filter tags on edit/init
    if (this.product?.category) {
      const cat = this.categories.find(c => c.slug === this.product!.category);
      this.filteredSubcategories = cat?.subcategories || [];
      this.filteredBrands = cat?.famousBrands?.length ? cat.famousBrands as unknown as IBrand[] : this.brands;
      this.filteredFilterTags = cat?.filterTags || [];
      this.selectedFilterTags = [...(this.product.filterTags || [])];
    } else {
      this.filteredBrands = this.brands;
    }
  }

  // ─── Variants helpers ────────────────────────────────────────────
  get variantsArray(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  get hasVariantsEnabled(): boolean {
    return !!this.form.get('hasVariants')?.value;
  }

  addVariant(): void {
    this.pushVariant();
    this.cdr.markForCheck();
  }

  private pushVariant(seed?: IProductVariant): void {
    const group = this.fb.group({
      id: [seed?.id || `var-${Date.now()}-${this.variantsArray.length}`],
      nameAr: [seed?.nameAr || '', Validators.required],
      name: [seed?.name || ''],
      wholesalePrice: [seed?.wholesalePrice ?? 0, [Validators.min(0)]],
      originalPrice: [seed?.originalPrice ?? 0, [Validators.required, Validators.min(0.01)]],
      discountedPrice: [seed?.discountedPrice ?? 0, [Validators.min(0)]],
      stock: [seed?.stock ?? 0, [Validators.min(0)]]
    });
    this.variantsArray.push(group);
    this.variantsMainImages.push([...(seed?.mainImages || [])]);
    this.variantsNaturalImages.push([...(seed?.naturalImages || [])]);
  }

  removeVariant(index: number): void {
    this.variantsArray.removeAt(index);
    this.variantsMainImages.splice(index, 1);
    this.variantsNaturalImages.splice(index, 1);
    this.cdr.markForCheck();
  }

  onVariantMainImagesChange(index: number, imgs: string[]): void {
    this.variantsMainImages[index] = imgs;
  }

  onVariantNaturalImagesChange(index: number, imgs: string[]): void {
    this.variantsNaturalImages[index] = imgs;
  }

  variantGroup(index: number): FormGroup {
    return this.variantsArray.at(index) as FormGroup;
  }

  toggleFilterTag(tag: string): void {
    const idx = this.selectedFilterTags.indexOf(tag);
    if (idx >= 0) {
      this.selectedFilterTags.splice(idx, 1);
    } else {
      this.selectedFilterTags.push(tag);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const originalPrice = +v.originalPrice;
    const discountedPrice = +v.discountedPrice;
    const wholesalePrice = +v.wholesalePrice;

    const discountPercentage = originalPrice > 0
      ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100 * 100) / 100
      : 0;

    const merchantProfitPercent = wholesalePrice > 0
      ? Math.round(((discountedPrice - wholesalePrice) / wholesalePrice) * 100 * 100) / 100
      : 0;

    const product: IProduct = {
      id: this.product?.id || '',
      title: v.title,
      titleAr: v.titleAr || undefined,
      description: v.description,
      descriptionAr: v.descriptionAr || undefined,
      descriptionHtml: v.descriptionHtml || undefined,
      descriptionHtmlAr: v.descriptionHtmlAr || undefined,
      price: originalPrice,
      discountPercentage,
      rating: +v.rating,
      ratingsCount: this.product?.ratingsCount || 0,
      stock: +v.stock,
      categoryId: this.categories.find(c => c.slug === v.category)?.id || 0,
      category: v.category,
      subcategory: v.subcategory || undefined,
      images: this.mainImages.length > 0 ? this.mainImages : ['https://picsum.photos/seed/new/600/600'],
      naturalImages: this.realImages.length > 0 ? this.realImages : undefined,
      swiperImages: this.swiperImages.length > 0 ? this.swiperImages : undefined,
      brand: v.brand,
      merchant: v.merchant || undefined,
      isFeatured: v.isFeatured,
      comingSoon: v.comingSoon,
      tags: this.product?.tags || [],
      filterTags: this.selectedFilterTags,
      slug: this.generatedSlug,
      categoryFolder: this.product?.categoryFolder,
      wholesalePrice,
      originalPrice,
      discountedPrice,
      minWholesaleQuantity: +v.minWholesaleQuantity || 0,
      offerPiecesCount: +v.offerPiecesCount || 0,
      offerPrice: +v.offerPrice || 0,
      merchantProfitPercent,
      productForm: this.product?.productForm,
      faq: this.faqs.filter(f => f.q || f.qAr),
      offers: this.offers.filter(o => o.text || o.textAr || o.image),
      comparisonSites: this.comparisonSites.filter(s => s.websiteName && s.price > 0).length
        ? this.comparisonSites.filter(s => s.websiteName && s.price > 0)
        : undefined,
      metaTitle: v.metaTitle || undefined,
      metaDescription: v.metaDescription || undefined,
      seoKeywords: v.seoKeywords ? v.seoKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : undefined,
      hasVariants: !!v.hasVariants,
      variantOptionType: v.hasVariants ? (v.variantOptionType || undefined) : undefined,
      variantOptionTypeAr: v.hasVariants
        ? this.variantTypeOptions.find(o => o.value === v.variantOptionType)?.labelAr
        : undefined,
      baseVariantNameAr: v.hasVariants ? (v.baseVariantNameAr || undefined) : undefined,
      variants: v.hasVariants ? this.collectVariants() : undefined
    };

    this.save.emit(product);
  }

  private collectVariants(): IProductVariant[] {
    return this.variantsArray.controls.map((ctrl, i) => {
      const val = (ctrl as FormGroup).value;
      return {
        id: val.id,
        name: val.name || val.nameAr,
        nameAr: val.nameAr || undefined,
        mainImages: this.variantsMainImages[i] || [],
        naturalImages: this.variantsNaturalImages[i]?.length ? this.variantsNaturalImages[i] : undefined,
        wholesalePrice: +val.wholesalePrice || 0,
        originalPrice: +val.originalPrice || 0,
        discountedPrice: +val.discountedPrice || 0,
        stock: +val.stock || 0
      } as IProductVariant;
    });
  }
}
