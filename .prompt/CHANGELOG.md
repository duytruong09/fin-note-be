# Prompt Changelog

## Version 1.0.0 (2026-02-16)

### expense-parser-vi.txt
- Initial Vietnamese expense parser prompt
- Support for common Vietnamese number formats (nghìn, triệu, k)
- Category mapping from Vietnamese to English
- Payment method detection
- Date parsing (hôm nay, hôm qua, etc.)
- Confidence scoring based on information completeness

### expense-parser-en.txt
- Initial English expense parser prompt
- Support for common English number formats (k, m)
- Category mapping
- Payment method detection
- Date parsing (today, yesterday, last week)
- Confidence scoring

### Features
- Structured output using OpenAI's Structured Outputs
- Zod schema validation
- Confidence scoring (0-1)
- Multi-language support (vi, en)
- Payment method detection
- Smart date parsing
