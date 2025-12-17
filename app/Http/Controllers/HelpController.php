<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class HelpController extends Controller
{
    public function index()
    {
        return Inertia::render('Help/HelpIndex');
    }

    public function category($category)
    {
        return Inertia::render('Help/HelpCategory', [
            'category' => $category,
            'articles' => [],
        ]);
    }

    public function detail($category, $slug)
    {
        return Inertia::render('Help/HelpDetail', [
            'article' => [],
            'relatedArticles' => [],
        ]);
    }
}
