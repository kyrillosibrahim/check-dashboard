import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IComparisonSite } from '../../../../core/models/product.model';
import { IExternalWebsite } from '../../../../core/models/external-website.model';
import { ExternalWebsiteService } from '../../../../core/services/external-website.service';

@Component({
  selector: 'app-comparison-sites-editor',
  imports: [FormsModule],
  templateUrl: './comparison-sites-editor.component.html',
  styleUrl: './comparison-sites-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComparisonSitesEditorComponent implements OnInit {
  @Input() sites: IComparisonSite[] = [];
  @Output() sitesChange = new EventEmitter<IComparisonSite[]>();

  private websiteService = inject(ExternalWebsiteService);
  private cdr = inject(ChangeDetectorRef);

  availableWebsites: IExternalWebsite[] = [];
  enabled = false;

  ngOnInit(): void {
    this.enabled = this.sites.length > 0;
    this.websiteService.getAll().subscribe(list => {
      this.availableWebsites = list;
      this.cdr.markForCheck();
    });
  }

  onToggle(): void {
    this.enabled = !this.enabled;
    if (this.enabled && this.sites.length === 0) {
      this.addSite();
    }
  }

  addSite(): void {
    this.sites = [...this.sites, { websiteName: '', websiteLogo: '', price: 0, link: '' }];
    this.emit();
  }

  removeSite(index: number): void {
    this.sites = this.sites.filter((_, i) => i !== index);
    this.emit();
    if (this.sites.length === 0) this.enabled = false;
  }

  onWebsiteSelect(index: number, websiteId: string): void {
    const site = this.availableWebsites.find(w => w.id === +websiteId);
    if (site) {
      const updated = [...this.sites];
      updated[index] = { ...updated[index], websiteId: site.id, websiteName: site.name, websiteLogo: site.logoUrl };
      this.sites = updated;
      this.emit();
    }
  }

  onFieldChange(): void {
    this.emit();
  }

  private emit(): void {
    this.sitesChange.emit([...this.sites]);
  }
}
