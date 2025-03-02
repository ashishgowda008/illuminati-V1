import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const privacyContent = `# Legal Terms & Privacy Policy for Illuminatii Website

## Terms of Service (ToS) – Illuminatii

**Effective Date: March 1, 2025** **Last Updated: March 1, 2025**

### 1\\. Introduction

Welcome to Illuminatii\\! These Terms of Service govern your access to and use of our website and services. By accessing or using Illuminatii, you agree to comply with these terms. If you do not agree, please do not use our services.

### 2\\. Definitions

* **"Platform"** refers to Illuminatii, accessible via illuminatii.com.  
* **"User"** refers to students, colleges, and brands using our services.  
* **"Sponsorship"** means financial, product-based, or promotional support provided by brands to students/colleges.  
* **"Content"** includes user-generated text, images, event listings, and sponsorship proposals.

### 3\\. Eligibility & Account Registration

* You must be 16+ years old to create an account.  
* You agree to provide accurate information and update it when necessary.  
* Illuminatii reserves the right to suspend or delete accounts violating these terms.

### 4\\. Use of Services

* Brands can create sponsorship listings, and colleges/students can apply.  
* Users must not post false, misleading, or offensive content.  
* Illuminatii does not guarantee sponsorship approvals; the final decision lies with brands.

### 5\\. Payments & Fees

* **Sponsorship Commissions**: Illuminatii charges a 6% commission on successful sponsorships.  
* **Premium Listings & Ads**: Brands may pay for featured sponsorships & promotions.  
* Payments are processed securely through third-party payment providers.

### 6\\. Content Ownership & Intellectual Property

* Users retain rights to their content but grant Illuminatii a non-exclusive license to display it.  
* **Trademarks & Logos**: All brand logos and content belong to their respective owners.

### 7\\. Prohibited Activities

Users must not:

* Submit fake sponsorship applications.  
* Use the platform for fraudulent transactions.  
* Copy or scrape website data for competitive purposes.

### 8\\. Termination & Account Suspension

Illuminatii reserves the right to:

* Suspend accounts for violations of terms.  
* Remove fraudulent sponsorship listings.  
* Take legal action against abusive users.

### 9\\. Disclaimers & Liability

* Illuminatii is not responsible for failed sponsorships, payment disputes, or brand-student conflicts.  
* We do not guarantee sponsorships but act as a platform for connections.  
* Users are responsible for verifying sponsors and applicants before committing.

### 10\\. Governing Law & Dispute Resolution

* This agreement is governed by Indian law.  
* Any disputes shall be resolved via arbitration in Bengaluru, Karnataka.

## Privacy Policy – Illuminatii

**Effective Date: March 1, 2025** **Last Updated: March 1, 2025**

### 1\\. Information We Collect

We collect the following user data:

* **Personal Information** (Name, Email, Phone, College/Brand Details)  
* **Sponsorship Data** (Event Listings, Brand Profiles)  
* **Technical Data**:  
  * IP addresses and device identifiers  
  * Browser type and version  
  * Operating system  
  * Session information and browsing activity  
  * Referral source and exit pages  
  * Date and time of access

### 2\\. How We Use Your Data

We use your data to:

* Match brands with colleges for sponsorship opportunities.  
* Improve user experience & platform functionality.  
* Send important service updates & marketing emails.

### 3\\. Data Sharing & Third-Party Access

* We do NOT sell user data.  
* Data may be shared with payment processors & security partners.  
* Brands may view student/college applications for sponsorship evaluation.

### 4\\. Cookies & Tracking Technologies

We do not use cookies.

### 5\\. Data Security & Protection

* We implement industry-standard security measures including encryption, secure hosting, and regular security audits.  
* We maintain strict access controls for employee access to user data.  
* We conduct regular security assessments and vulnerability testing.  
* All data transfers are protected using SSL/TLS encryption.  
* Users are responsible for maintaining strong passwords & account security.

### 6\\. Your Rights & Choices

* Users can request data deletion at any time.  
* Users can opt out of marketing emails via account settings.

### 7\\. Third-Party Links & Advertisements

* Our platform may contain external brand links; we are not responsible for third-party policies.

### 8\\. Updates to This Policy

We may update this Privacy Policy periodically. Users will be notified via email or platform announcements.

### 9\\. Contact Information

For any concerns regarding privacy & data protection:

* **Email**: [originalilluminatii@gmail.com](mailto:originalilluminatii@gmail.com)  
* **Office Address**: Bengaluru, India

### 10\\. Data Retention

We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by applicable laws and regulations.

### 11\\. International Data Transfers

While our primary operations are in India, we may transfer data internationally to service providers. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.

### 12\\. Children's Privacy

Our services are not intended for use by individuals under the age of 16\\. We do not knowingly collect personal information from children.
`;

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 privacy-container">
      <article className="prose prose-lg prose-invert max-w-none">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-5 mb-2" {...props} />,
            p: ({node, ...props}) => <p className="my-3" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-6 my-3" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-3" {...props} />,
            li: ({node, ...props}) => <li className="mb-1" {...props} />,
            a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
          }}
        >
          {privacyContent}
        </ReactMarkdown>
      </article>
    </div>
  );
};

export default Privacy;