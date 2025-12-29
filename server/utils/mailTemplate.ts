export interface EmailTemplate {
  recipientName: string;
  emailTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonLink: string;
  heroButtonText: string;
  contentTitle1: string;
  contentImageURL?: string;
  contentImageAlt?: string;
  contentParagraph1: string;
  contentParagraph2?: string;
  contentTitle2?: string;
  contentListItems?: string[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonLink: string;
  ctaButtonText: string;
  websiteLink?: string;
  logoURL?: string;
  companyName?: string;
  privacyPolicyLink?: string;
  termsAndConditionsLink?: string;
  unsubscribeLink?: string;
  serviceName?: string;
  currentYear?: number;
  qrCodeDataUrl?: string;
}
const config = useRuntimeConfig();
class Email {
  private recipientName: string;
  private emailTitle: string;
  private heroTitle: string;
  private heroSubtitle: string;
  private heroButtonLink: string;
  private heroButtonText: string;
  private contentTitle1: string;
  private contentImageURL?: string;
  private contentImageAlt?: string;
  private contentParagraph1: string;
  private contentParagraph2?: string;
  private contentTitle2?: string;
  private contentListItems?: string[];
  private ctaTitle: string;
  private ctaSubtitle: string;
  private ctaButtonLink: string;
  private ctaButtonText: string;
  private websiteLink: string = config.public.public_uri;
  private logoURL: string = `${config.public.public_uri}/img/logo.png`;
  private companyName: string = config.public.appname;
  private privacyPolicyLink?: string;
  private termsAndConditionsLink?: string;
  private unsubscribeLink?: string;
  private serviceName: string = config.public.appname;
  private currentYear: number = new Date().getFullYear();
  private qrCodeDataUrl?: string;

  constructor({
    recipientName,
    emailTitle,
    heroTitle,
    heroSubtitle,
    heroButtonLink,
    heroButtonText,
    contentTitle1,
    contentImageURL,
    contentImageAlt,
    contentParagraph1,
    contentParagraph2,
    contentTitle2,
    contentListItems,
    ctaTitle,
    ctaSubtitle,
    ctaButtonLink,
    ctaButtonText,
    privacyPolicyLink,
    termsAndConditionsLink,
    unsubscribeLink,
    qrCodeDataUrl,
  }: EmailTemplate) {
    this.recipientName = recipientName;
    this.emailTitle = emailTitle;
    this.heroTitle = heroTitle;
    this.heroSubtitle = heroSubtitle;
    this.heroButtonLink = heroButtonLink;
    this.heroButtonText = heroButtonText;
    this.contentTitle1 = contentTitle1;
    this.contentImageURL = contentImageURL;
    this.contentImageAlt = contentImageAlt;
    this.contentParagraph1 = contentParagraph1;
    this.contentParagraph2 = contentParagraph2;
    this.contentTitle2 = contentTitle2;
    this.contentListItems = contentListItems;
    this.ctaTitle = ctaTitle;
    this.ctaSubtitle = ctaSubtitle;
    this.ctaButtonLink = ctaButtonLink;
    this.ctaButtonText = ctaButtonText;
    this.privacyPolicyLink = privacyPolicyLink;
    this.termsAndConditionsLink = termsAndConditionsLink;
    this.unsubscribeLink = unsubscribeLink;
    this.qrCodeDataUrl = qrCodeDataUrl;
  }

  public render(): string {
    const listItemHTML = this.contentListItems
      ? this.contentListItems.map((item) => `<li>${item}</li>`).join("")
      : "";

    return `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.emailTitle}</title>
        <style>
          /* Reset basic browser styles */
          body { margin:0; padding:0; min-width:100%!important; background-color:#f4f4f4; }
          .container { width:100%; max-width:600px; margin:0 auto; }
          .header { background-color:#ffffff; padding:20px 20px; text-align:center; }
          .header img { max-width: 200px; height: auto; }
          .hero { background-color:#f0f8ff; padding:40px 20px; text-align:center; }
          .hero h1 { color:#007bff; font-size:2.5em; margin-bottom:10px; }
          .hero p { font-size:1.2em; color:#555; margin-bottom:20px; }
          .content { background-color:#ffffff; padding:20px 20px; }
          .content h1 { color:#333; font-size:1.8em; margin-top:0; margin-bottom:10px; }
          .content img { max-width:100%; height:auto; margin-bottom:20px; }
          .content h2 { color:#333; margin-top:0; margin-bottom:15px; }
          .content p { color:#555; margin-bottom:15px; }
          .cta { background-color:#e9ecef; padding:30px 20px; text-align:center; }
          .button { display:inline-block; padding:12px 25px; background-color:#007bff; color:#fff; text-decoration:none; border-radius:5px; font-weight:bold; }
          .button:hover { background-color:#0056b3; }
          .footer { background-color:#333; color:#fff; padding:20px; text-align:center; font-size:0.9em; }
          .footer p { margin:5px 0; }
          .footer a { color:#ffffff; text-decoration:underline; }
        </style>
        </head>
        <body>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td bgcolor="#f4f4f4">
                <div style="max-width: 600px; margin: 0 auto;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td class="header">
                        <a href="${this.websiteLink}"><img src="${
      this.logoURL
    }" alt="Logo ${this.companyName}"></a>
                      </td>
                    </tr>
                  </table>
  
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td class="hero">
                        <h1>Halo ${this.recipientName}, ${this.heroTitle}</h1>
                        <p>${this.heroSubtitle}</p>
                        <a href="${this.heroButtonLink}" class="button">${
      this.heroButtonText
    }</a>
                      </td>
                    </tr>
                  </table>
  
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td class="content">
                        <h2>${this.contentTitle1}</h2>
                        ${
                          this.contentImageURL
                            ? `<img src="${this.contentImageURL}" alt="${
                                this.contentImageAlt || "Content Image"
                              }">`
                            : ""
                        }
                        <p>${this.contentParagraph1}</p>
                        ${
                          this.qrCodeDataUrl
                            ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${this.qrCodeDataUrl}" alt="QR Code"></div>`
                            : ""
                        }
                        ${
                          this.contentParagraph2
                            ? `<p>${this.contentParagraph2}</p>`
                            : ""
                        }
                      </td>
                    </tr>
                  </table>
  
                  ${
                    this.contentTitle2
                      ? `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td class="content">
                        <h2>${this.contentTitle2}</h2>
                        <ul>
                          ${listItemHTML}
                        </ul>
                      </td>
                    </tr>
                  </table>
                  `
                      : ""
                  }
  
  
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td class="cta">
                        <h2>${this.ctaTitle}</h2>
                        <p>${this.ctaSubtitle}</p>
                        <a href="${this.ctaButtonLink}" class="button">${
      this.ctaButtonText
    }</a>
                      </td>
                    </tr>
                  </table>
  
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td class="footer">
                        <p>&copy; ${this.currentYear} ${
      this.companyName
    }. All rights reserved.</p>
                        <p><a href="${
                          this.privacyPolicyLink
                        }">Kebijakan Privasi</a> | <a href="${
      this.termsAndConditionsLink
    }">Syarat & Ketentuan</a></p>
                        ${
                          this.unsubscribeLink
                            ? `<p>Anda menerima email ini karena Anda berlangganan ${this.serviceName}.</p>
                        <p>Jika Anda tidak ingin menerima email lagi, klik <a href="${this.unsubscribeLink}">di sini</a>.</p>`
                            : ""
                        }
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
  }
}

export default Email;
