# carat-api-aws

## Documentation

- [Documentation](https://can-not-access-from-exapmle)

## Section

* [Overview Page](#overview-page)
* [User Analysis](#user-analysis)
* [Product Page](#product-page)
* [Referral Page](#referral-page)
* [Crowd Analysis](#crowd-analysis)

## Usage

- general parameters
	- domain
	- group
	- from
	- to
	- device

- stage
	- [x] dev
	- [x] prod

- domain
	- [x] nissan
	- [x] mitsubishi_young
	- [x] mitsubishi

- {from}/{to}
	- *date format: YYYY-MM-DD*

</br>

## Cluster

### clustering

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}` |
| example | [clustering](https://can-not-access-from-exapmle) |

### clusters-clients-inserting

| Key | Description |
| --- | --- |
| method  | POST |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `` |
| example | [clusters-clients-inserting](https://can-not-access-from-exapmle) |

## Overview Page

### general

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [general](https://can-not-access-from-exapmle) |

### product-ranking

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [product-ranking](https://can-not-access-from-exapmle) |

### book

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [book](https://can-not-access-from-exapmle) |

### session-per-time

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters | `{domain}/{group}/{referrerCategory}/{from}/{to}` |
| explain | referrerCategory : {0 : all, 1 : organic, 2 : paid} |
| example | [session-per-time](https://can-not-access-from-exapmle) |

### session-per-hour

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [session-per-hour](https://can-not-access-from-exapmle) |

### weekly-compare

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}` |
| example | [weekly-compare](https://can-not-access-from-exapmle) |

### period-compare

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [period-compare](https://can-not-access-from-exapmle) |

### media-compare

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{group}/{from}/{to}` |
| example | [media-compare](https://can-not-access-from-exapmle) |

</br>

## User Analysis

### browser-distribution

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [browser-distribution](https://can-not-access-from-exapmle) |

### language-distribution

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [language-distribution](https://can-not-access-from-exapmle) |

### operating-system-distribution

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [operating-system-distribution](https://can-not-access-from-exapmle) |

### returning-distribution

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [returning-distribution](https://can-not-access-from-exapmle) |

### search-term-distribution

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [search-term-distribution](https://can-not-access-from-exapmle) |

### user-sankey-diagram

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [user-sankey-diagram](https://can-not-access-from-exapmle) |

### exit-page-table

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [exit-page-table](https://can-not-access-from-exapmle) |

### location-distribution

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [location-distribution](https://can-not-access-from-exapmle) |

</br>

## Product Page

### product-general

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [product-general](https://can-not-access-from-exapmle) |

### product-single-general

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{productId}/{from}/{to}` |
| example | [product-single-general](https://can-not-access-from-exapmle) |

### product-page-scroll-table

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{productId}/{from}/{to}` |
| example | [product-page-scroll-table](https://can-not-access-from-exapmle) |

### related-product-table

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{productId}/{from}/{to}` |
| example | [related-product-table](https://can-not-access-from-exapmle) |

### product-referral-analysis-table

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{productId}/{from}/{to}` |
| example | [product-referral-analysis-table](https://can-not-access-from-exapmle) |

### product-list

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}` |
| example | [product-list](https://can-not-access-from-exapmle) |

</br>

## Referral Page

### advertising-media-distribution

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [advertising-media-distribution](https://can-not-access-from-exapmle) |

### visitor-trends

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [visitor-trends](https://can-not-access-from-exapmle) |

### visitor-trends-media-list

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [visitor-trends-media-list](https://can-not-access-from-exapmle) |

### visitor-trends-single

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{mediaId}/{from}/{to}` |
| example | [visitor-trends-single](https://can-not-access-from-exapmle) |

### media-info-table

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [media-info-table](https://can-not-access-from-exapmle) |

### media-trends-table

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [media-trends-table](https://can-not-access-from-exapmle) |

### customer-conversion-dot-table

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}` |
| example | [customer-conversion-dot-table](https://can-not-access-from-exapmle) |

### media-campaign-product

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{from}/{to}` |
| example | [media-campaign-product](https://can-not-access-from-exapmle) |

### media-conversion-table

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}` |
| example | [media-conversion-table](https://can-not-access-from-exapmle) |

### related-media-general

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [related-media-general](https://can-not-access-from-exapmle) |

### related-media-single

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}/{from}/{to}` |
| example | [related-media-single](https://can-not-access-from-exapmle) |

## Crowd Analysis

### crowd-analysis-total

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}` |
| example | [crowd-analysis-total](https://can-not-access-from-exapmle) |

### crowd-analysis-last-access

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}` |
| example | [crowd-analysis-last-access](https://can-not-access-from-exapmle) |

### crowd-analysis-session-times

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}` |
| example | [crowd-analysis-session-times](https://can-not-access-from-exapmle) |

### crowd-analysis-staying-duration

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}` |
| example | [crowd-analysis-staying-duration](https://can-not-access-from-exapmle) |

### crowd-analysis-first-media

| Key | Description |
| --- | --- |
| method  | GET |
| endpoint | https://can-not-access-from-exapmle|
| parameters| `{domain}/{group}` |
| example | [crowd-analysis-first-media](https://can-not-access-from-exapmle) |