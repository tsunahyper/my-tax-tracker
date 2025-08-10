output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend_distribution.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend_distribution.domain_name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.frontend_bucket.bucket
}

output "frontend_url" {
  description = "URL of the frontend application"
  value       = "https://${aws_cloudfront_distribution.frontend_distribution.domain_name}"
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.frontend_bucket.arn
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend_distribution.arn
}