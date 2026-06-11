<?php

// Style @Symfony, purement cosmétique. On NE met PAS declare_strict_types ici :
// l'ajouter sur 17 600 LOC de legacy changerait le comportement runtime (coercition
// de types) — trop risqué sans relecture ligne à ligne. À introduire au fil de l'eau.
$finder = (new PhpCsFixer\Finder())
    ->in(__DIR__.'/src')
    ->in(__DIR__.'/tests')
;

return (new PhpCsFixer\Config())
    ->setRules([
        '@Symfony' => true,
        'no_unused_imports' => true,
        'ordered_imports' => ['sort_algorithm' => 'alpha'],
        'single_quote' => true,
    ])
    ->setFinder($finder)
;
