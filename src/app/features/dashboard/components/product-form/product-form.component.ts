import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IProduct } from '../../../../core/models/product.model';
import { ICategory, ISubcategory } from '../../../../core/models/category.model';
import { IBrand } from '../../../../core/models/brand.model';
import { IMerchant } from '../../../../core/models/merchant.model';
import { ProductService } from '../../../../core/services/product.service';
import { ImageUploaderComponent } from '../image-uploader/image-uploader.component';
import { PriceCalculatorComponent } from '../price-calculator/price-calculator.component';
import { OffersEditorComponent, IOffer } from '../offers-editor/offers-editor.component';
import { RichTextEditorComponent } from '../rich-text-editor/rich-text-editor.component';
import { FaqEditorComponent, IFaqItem } from '../faq-editor/faq-editor.component';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, ImageUploaderComponent, PriceCalculatorComponent, OffersEditorComponent, RichTextEditorComponent, FaqEditorComponent],
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
    offers: false,
    faq: false,
    seo: false,
    details: false
  };

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
      seoKeywords: [this.product?.seoKeywords?.join(', ') || '']
    });

    if (this.product) {
      this.mainImages = [...(this.product.images || [])];
      this.swiperImages = [...(this.product.swiperImages || [])];
      this.realImages = [...(this.product.naturalImages || [])];
      this.offers = [...(this.product.offers || [])];
      this.faqs = (this.product.faq || []).map(f => ({ ...f }));
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
      isWholesaleOffer: this.product?.isWholesaleOffer || false,
      tags: this.product?.tags || [],
      filterTags: this.selectedFilterTags,
      slug: this.generatedSlug,
      categoryFolder: this.product?.categoryFolder,
      wholesalePrice,
      originalPrice,
      discountedPrice,
      merchantProfitPercent,
      productForm: this.product?.productForm,
      faq: this.faqs.filter(f => f.q || f.qAr),
      offers: this.offers.filter(o => o.text || o.textAr || o.image),
      metaTitle: v.metaTitle || undefined,
      metaDescription: v.metaDescription || undefined,
      seoKeywords: v.seoKeywords ? v.seoKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : undefined
    };

    this.save.emit(product);
  }
}
