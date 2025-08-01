class WhiteLabelConfig {
      constructor() {
        this.config = {
          brandName: 'TinkyBink AAC',
          logo: '/assets/logo.png',
          primaryColor: '#4A90E2',
          secondaryColor: '#F5A623',
          customDomain: null,
          customEmails: false,
          removeWatermark: false,
          customCSS: '',
          features: {
            showPoweredBy: true,
            customSplash: false,
            customOnboarding: false
          }
        };
      }
      
      async updateBranding(brandConfig) {
        // Validate subscription allows white labeling
        if (!window.features?.customBranding) {
          throw new Error('White labeling requires Professional or Enterprise plan');
        }
        
        this.config = { ...this.config, ...brandConfig };
        
        // Apply branding immediately
        this.applyBranding();
        
        // Save to server
        await this.saveBrandingConfig();
      }
      
      applyBranding() {
        // Update logo
        document.querySelectorAll('.logo').forEach(logo => {
          logo.src = this.config.logo;
        });
        
        // Update brand name
        document.querySelectorAll('.brand-name').forEach(element => {
          element.textContent = this.config.brandName;
        });
        
        // Update colors
        const style = document.createElement('style');
        style.textContent = `
          :root {
            --primary-color: ${this.config.primaryColor};
            --secondary-color: ${this.config.secondaryColor};
          }
          
          .btn-primary {
            background-color: ${this.config.primaryColor};
          }
          
          .btn-secondary {
            background-color: ${this.config.secondaryColor};
          }
          
          ${this.config.customCSS}
        `;
        document.head.appendChild(style);
        
        // Update title
        document.title = this.config.brandName;
        
        // Hide/show powered by
        const poweredBy = document.querySelector('.powered-by');
        if (poweredBy) {
          poweredBy.style.display = this.config.features.showPoweredBy ? '' : 'none';
        }
      }
      
      async configureDomain(domain) {
        // Enterprise only
        if (!window.features?.apiAccess) {
          throw new Error('Custom domains require Enterprise plan');
        }
        
        this.config.customDomain = domain;
        
        // Generate DNS records
        const dnsRecords = this.generateDNSRecords(domain);
        
        // Verify domain ownership
        const verified = await this.verifyDomain(domain);
        
        if (verified) {
          // Configure SSL
          await this.configureSSL(domain);
          
          // Update routing
          await this.updateRouting(domain);
        }
        
        return { verified, dnsRecords };
      }
      
      generateDNSRecords(domain) {
        return [
          {
            type: 'CNAME',
            host: 'www',
            value: 'custom.tinkybink.app',
            ttl: 3600
          },
          {
            type: 'A',
            host: '@',
            value: '192.0.2.1', // Example IP
            ttl: 3600
          },
          {
            type: 'TXT',
            host: '_tinkybink-verify',
            value: `verify-${crypto.randomUUID()}`,
            ttl: 300
          }
        ];
      }
      
      async verifyDomain(domain) {
        try {
          const response = await fetch('/api/domains/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${window.authSystem?.getToken()}`
            },
            body: JSON.stringify({ domain })
          });
          
          const result = await response.json();
          return result.verified;
        } catch (error) {
          console.error('Domain verification failed:', error);
          return false;
        }
      }
      
      async configureSSL(domain) {
        // Request Let's Encrypt certificate
        await fetch('/api/domains/ssl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.authSystem?.getToken()}`
          },
          body: JSON.stringify({ domain })
        });
      }
      
      async updateRouting(domain) {
        // Update nginx/cloudflare routing
        await fetch('/api/domains/routing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.authSystem?.getToken()}`
          },
          body: JSON.stringify({ domain, target: window.location.hostname })
        });
      }
      
      async saveBrandingConfig() {
        await fetch('/api/branding', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.authSystem?.getToken()}`
          },
          body: JSON.stringify(this.config)
        });
      }
      
      exportBrandingKit() {
        const kit = {
          config: this.config,
          assets: {
            logo: this.config.logo,
            favicon: this.generateFavicon(),
            colors: {
              primary: this.config.primaryColor,
              secondary: this.config.secondaryColor,
              palette: this.generateColorPalette()
            }
          },
          guidelines: this.generateBrandGuidelines()
        };
        
        // Download as zip
        this.downloadBrandingKit(kit);
      }
      
      generateFavicon() {
        // Generate favicon from logo
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.src = this.config.logo;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 32, 32);
        };
        
        return canvas.toDataURL('image/png');
      }
      
      generateColorPalette() {
        // Generate complementary colors
        const primary = this.hexToRgb(this.config.primaryColor);
        const secondary = this.hexToRgb(this.config.secondaryColor);
        
        return {
          primary: this.config.primaryColor,
          secondary: this.config.secondaryColor,
          primaryLight: this.lighten(primary, 0.2),
          primaryDark: this.darken(primary, 0.2),
          secondaryLight: this.lighten(secondary, 0.2),
          secondaryDark: this.darken(secondary, 0.2),
          neutral: '#F5F5F5',
          text: '#333333'
        };
      }
      
      hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      }
      
      lighten(rgb, percent) {
        return `#${Object.values(rgb).map(c => 
          Math.round(c + (255 - c) * percent).toString(16).padStart(2, '0')
        ).join('')}`;
      }
      
      darken(rgb, percent) {
        return `#${Object.values(rgb).map(c => 
          Math.round(c * (1 - percent)).toString(16).padStart(2, '0')
        ).join('')}`;
      }
      
      generateBrandGuidelines() {
        return `
          # ${this.config.brandName} Brand Guidelines
          
          ## Logo Usage
          - Minimum size: 32px height
          - Clear space: 50% of logo height on all sides
          - Do not rotate, skew, or distort
          
          ## Colors
          - Primary: ${this.config.primaryColor}
          - Secondary: ${this.config.secondaryColor}
          
          ## Typography
          - Headers: Poppins Bold
          - Body: Inter Regular
          - UI Elements: Inter Medium
        `;
      }
      
      downloadBrandingKit(kit) {
        // Create zip file with branding assets
        const zip = new JSZip();
        zip.file('config.json', JSON.stringify(kit.config, null, 2));
        zip.file('guidelines.md', kit.guidelines);
        zip.file('colors.json', JSON.stringify(kit.assets.colors, null, 2));
        
        zip.generateAsync({ type: 'blob' }).then(content => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(content);
          a.download = `${this.config.brandName.replace(/\s+/g, '-').toLowerCase()}-branding-kit.zip`;
          a.click();
        });
      }
    }
    
    // Monitoring and Analytics System