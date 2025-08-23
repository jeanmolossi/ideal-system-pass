export function inferServiceInfo(title: string, categories: string[]): { id: string; category: string } {
  const service = title.split(/[-|–]/)[0]?.trim() || '';
  const lowerTitle = title.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    social: ['facebook', 'twitter', 'instagram', 'linkedin', 'reddit', 'social'],
    email: ['mail', 'gmail', 'outlook', 'yahoo', 'email'],
    streaming: ['netflix', 'youtube', 'hulu', 'disney', 'prime video', 'stream', 'streaming'],
    banking: ['bank', 'finance', 'paypal', 'stripe', 'banking'],
    shopping: ['amazon', 'ebay', 'shopping'],
    'cloud provider': [
      'aws',
      'amazon web services',
      'azure',
      'microsoft azure',
    ],
    monitoring: ['grafana'],
    database: ['percona'],
    security: ['vault', 'hashicorp vault', 'hashicorp'],
    ci: ['jenkins'],
    'ci/cd': ['jenkins'],
  };

  let matchedCategory = '';
  for (const cat of categories) {
    const keywords = categoryKeywords[cat.toLowerCase()] || [cat.toLowerCase()];
    if (keywords.some((kw) => lowerTitle.includes(kw))) {
      matchedCategory = cat;
      break;
    }
  }

  return { id: service, category: matchedCategory };
}
