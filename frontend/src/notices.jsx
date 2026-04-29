// frontend/src/notices.jsx
// Notice content for the check-in kiosk signature screen.
// Replace with Justin's finalized legal text when received.
// Each notice has a title and a content JSX element.

export const NOTICES = {
  privacyNotice: {
    title: 'HIPAA Privacy Notice',
    summary: 'How we use and protect your health information',
    content: (
      <>
        <p><strong>Last Updated: January 2026</strong></p>

        <p>
          At Vantage Mental Health, we are committed to maintaining the privacy
          and confidentiality of your protected health information (PHI). This
          notice outlines how we safeguard your PHI in accordance with HIPAA and
          other applicable laws.
        </p>

        <h4>What Is Protected Health Information (PHI)?</h4>
        <p>
          PHI includes information that identifies you and relates to your past,
          present, or future physical or mental health conditions, treatment
          received, and payment for healthcare services. This may include
          demographic information, medical history, test results, insurance
          information, and other health-related data.
        </p>

        <h4>How We Use and Share Your PHI</h4>
        <p>We use and disclose your PHI for the following purposes:</p>
        <ul>
          <li><strong>Treatment:</strong> Sharing information with healthcare providers involved in your care</li>
          <li><strong>Payment:</strong> Billing and processing insurance claims</li>
          <li><strong>Healthcare Operations:</strong> Quality improvement activities, staff training, and compliance audits</li>
          <li><strong>Mandated Reporting:</strong> Reporting suspected abuse, neglect, or exploitation as required by law</li>
          <li><strong>Additional Legal Requirements:</strong> Disclosure when legally compelled</li>
        </ul>

        <h4>Your Rights Regarding Your PHI</h4>
        <ul>
          <li>Right to access and obtain copies of your PHI</li>
          <li>Right to request amendments to inaccurate or incomplete PHI</li>
          <li>Right to restrict disclosure of PHI</li>
          <li>Right to request confidential communications</li>
          <li>Right to receive an accounting of certain disclosures</li>
        </ul>

        <h4>How We Protect Your Information</h4>
        <p>
          We maintain administrative, physical, and technical safeguards to
          protect your PHI from unauthorized access, use, or disclosure.
          Safeguards include staff training, secure electronic systems,
          encryption, and controlled access to physical records.
        </p>

        <h4>Breach Notification</h4>
        <p>
          In the event of a breach of unsecured PHI, we will notify you as
          required by law, including information about what happened, steps you
          can take to protect yourself, and actions we are taking to address the
          breach.
        </p>

        <h4>Questions or Complaints</h4>
        <p>
          If you believe your privacy rights have been violated, you may file a
          complaint with us or with the U.S. Department of Health and Human
          Services. We will not retaliate against you for filing a complaint.
          Contact our Privacy Officer, <strong>Justin Gerstner</strong>, at{' '}
          <strong>[info@vantagementalhealth.org](mailto:info@vantagementalhealth.org)</strong>.
        </p>
      </>
    ),
  },

  insuredSignature: {
    title: 'Assignment of Benefits',
    summary: 'Authorization to bill your insurance on your behalf',
    content: (
      <>
        <p>
          By signing below, I authorize Vantage Mental Health to bill my
          insurance carrier directly for services rendered on my behalf.
        </p>

        <h4>What This Means</h4>
        <ul>
          <li>
            I authorize my insurance benefits to be paid directly to Vantage
            Mental Health for services I receive.
          </li>
          <li>
            I understand that I am financially responsible for any charges not
            covered by my insurance, including co-pays, deductibles, and
            non-covered services.
          </li>
          <li>
            I authorize Vantage Mental Health to submit claims and supporting
            documentation to my insurance company as needed to process payment.
          </li>
        </ul>

        <h4>Billing and Payment</h4>
        <p>
          Vantage Mental Health will bill your insurance carrier for covered
          services. Any balance remaining after insurance payment is your
          responsibility and will be billed to you directly. Payment is due
          upon receipt of your statement.
        </p>

        <h4>Questions</h4>
        <p>
          For billing questions, contact Vantage Mental Health at{' '}
          <strong>(651) 217-1480</strong> or{' '}
          <strong>[info@vantagementalhealth.org](mailto:info@vantagementalhealth.org)</strong>.
        </p>
      </>
    ),
  },

  patientSignature: {
    title: 'Release of Billing Information',
    summary: 'Authorization to release information needed for billing',
    content: (
      <>
        <p>
          By signing below, I authorize Vantage Mental Health to release any
          medical or health information necessary to process billing and
          insurance claims on my behalf.
        </p>

        <h4>What Information May Be Released</h4>
        <ul>
          <li>
            Diagnosis codes and treatment information required to submit
            insurance claims
          </li>
          <li>
            Medical records or clinical notes requested by my insurance carrier
            to verify services
          </li>
          <li>
            Any other information necessary for the processing, adjudication,
            or payment of my claims
          </li>
        </ul>

        <h4>Who May Receive This Information</h4>
        <ul>
          <li>My health insurance carrier or third-party payer</li>
          <li>Medicare or Medicaid, if applicable</li>
          <li>Any other entity involved in processing my claim</li>
        </ul>

        <h4>Mandated Reporting</h4>
        <p>
          I acknowledge that Vantage Mental Health has a legal and ethical duty
          to report certain situations involving suspected abuse, neglect, or
          exploitation of vulnerable individuals, as required by Minnesota state
          law and federal regulations.
        </p>

        <h4>SMS Communications</h4>
        <p>
          Vantage Mental Health may send SMS text messages to patients who have
          provided written consent. Message frequency varies. Msg &amp; data
          rates may apply. Reply STOP to unsubscribe or HELP for assistance.
        </p>

        <h4>Questions</h4>
        <p>
          For questions about this authorization, contact us at{' '}
          <strong>(651) 217-1480</strong> or{' '}
          <strong>[info@vantagementalhealth.org](mailto:info@vantagementalhealth.org)</strong>.
        </p>
      </>
    ),
  },
};
