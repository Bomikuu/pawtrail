/** Display artwork only. A coat illustration is never identity evidence. */
export function animalPlaceholder(
  species: string,
  appearance = '',
): string | null {
  if (species !== 'cat' && species !== 'dog') return null
  const coat = appearance.toLowerCase()
  const color =
    /black|itim/.test(coat) && !/white|puti|calico|tortoise|spot/.test(coat)
      ? 'black'
      : /white|puti/.test(coat) && !/black|itim|calico|spot/.test(coat)
        ? 'white'
        : /gr[ae]y|blue coat|silver/.test(coat)
          ? 'gray'
          : /cream|beige|fawn/.test(coat)
            ? 'cream'
            : /brown|chocolate/.test(coat)
              ? 'brown'
              : null
  if (color)
    return `/pawtrail-game/discovery/${species}-${color}-placeholder-v2.webp`
  if (/orange|ginger|tabby|calico|tortoise|spot|patch|siamese|point/.test(coat))
    return `/pawtrail-game/discovery/${species}-placeholder-v1.webp`
  return `/pawtrail-game/discovery/${species}-gray-placeholder-v2.webp`
}
