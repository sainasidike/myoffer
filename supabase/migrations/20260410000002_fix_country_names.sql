-- Fix inconsistent country names: AU → Australia, HK → Hong Kong, SG → Singapore
UPDATE public.programs SET country = 'Australia' WHERE country = 'AU';
UPDATE public.programs SET country = 'Hong Kong' WHERE country = 'HK';
UPDATE public.programs SET country = 'Singapore' WHERE country = 'SG';
