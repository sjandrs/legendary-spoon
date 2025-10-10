describe('Basic Test Suite', () => {
  it('should run basic tests', () => {
    expect(true).toBe(true);
  });

  it('should perform basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle strings', () => {
    expect('hello world').toContain('world');
  });
});
