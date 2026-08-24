# DNS records for librechart.org

Added in the Cloudflare dashboard (DNS → Records) for the zone. These are all
public records; none of them are secrets.

## Resend — domain verification (DKIM)

| Type | Name | Content | TTL |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDFiaqv1FvcoJvHacYuQ1QuEDIAA9LA+BAedAorBVvO7lOrahoxI8/aQ72B0d7CXcqxQv3CzT0xKuAEl1qg2/bo1GQbSD92dptOlAXEgr0OH+bfbY+ZUi1XlpcJ+F5mAqihjhlTD7ibsHJ5kwhA4+GjQ1+ANrZ9BLicWb+Qwg2M5wIDAQAB` | Auto |

## Resend — sending (SPF)

| Type | Name | Content | TTL | Priority |
|---|---|---|---|---|
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | Auto | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | Auto | |

## DMARC (optional but recommended)

| Type | Name | Content | TTL |
|---|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none;` | Auto |

`p=none` only monitors. Once you have seen a few weeks of reports and know
nothing legitimate is failing, tighten to `p=quarantine`.

## Notes

- Set these records to **DNS only** (grey cloud), not proxied. Proxying a TXT
  record is a no-op, but proxying the `send` MX record would break mail.
- The sending domain must show **Verified** in Resend before
  `CONTACT_FROM` (`site@librechart.org`) will deliver.
