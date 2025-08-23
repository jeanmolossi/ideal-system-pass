import { inferServiceInfo } from './inferServiceInfo';

describe('inferServiceInfo', () => {
  it('extracts service name and infers streaming category', () => {
    const result = inferServiceInfo('Netflix - Watch TV Shows Online', ['Streaming', 'Social']);
    expect(result).toEqual({ id: 'Netflix', category: 'Streaming' });
  });

  it('infers social category using keywords', () => {
    const result = inferServiceInfo('Facebook – log in', ['Social', 'Banking']);
    expect(result.id).toBe('Facebook');
    expect(result.category).toBe('Social');
  });

  it('returns empty category when no match is found', () => {
    const result = inferServiceInfo('Unknown Service', ['Social', 'Banking']);
    expect(result).toEqual({ id: 'Unknown Service', category: '' });
  });

  it('infers cloud provider category for AWS and Azure', () => {
    const aws = inferServiceInfo('Amazon Web Services - Console', ['Cloud Provider', 'Monitoring']);
    expect(aws).toEqual({ id: 'Amazon Web Services', category: 'Cloud Provider' });

    const azure = inferServiceInfo('Microsoft Azure – Portal', ['Cloud Provider']);
    expect(azure).toEqual({ id: 'Microsoft Azure', category: 'Cloud Provider' });
  });

  it('infers monitoring category for Grafana', () => {
    const result = inferServiceInfo('Grafana - Login', ['Monitoring', 'Database']);
    expect(result).toEqual({ id: 'Grafana', category: 'Monitoring' });
  });

  it('infers database category for Percona', () => {
    const result = inferServiceInfo('Percona Server - Sign In', ['Database', 'Monitoring']);
    expect(result.id).toBe('Percona Server');
    expect(result.category).toBe('Database');
  });

  it('infers security category for Vault', () => {
    const result = inferServiceInfo('Hashicorp Vault - Sign In', ['Security', 'CI']);
    expect(result).toEqual({ id: 'Hashicorp Vault', category: 'Security' });
  });

  it('infers CI category for Jenkins', () => {
    const result = inferServiceInfo('Jenkins - Dashboard', ['CI', 'Cloud Provider']);
    expect(result).toEqual({ id: 'Jenkins', category: 'CI' });
  });
});
