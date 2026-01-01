<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class HelpController extends Controller
{
    /**
     * Display the help center homepage
     */
    public function index()
    {
        return Inertia::render('Help/HelpIndex');
    }

    /**
     * Display all articles in a category
     */
    public function category($category)
    {
        return Inertia::render('Help/HelpCategory', [
            'category' => $category,
        ]);
    }

    /**
     * Display search page
     */
    public function search()
    {
        $query = request()->query('q', '');
        
        return Inertia::render('Help/HelpSearch', [
            'query' => $query,
        ]);
    }

    /**
     * Display FAQ page
     */
    public function faq()
    {
        return Inertia::render('Help/HelpFAQ');
    }

    /**
     * Display contact support page
     */
    public function contact()
    {
        return Inertia::render('Help/HelpContact');
    }

    /**
     * Handle contact form submission
     */
    public function submitContact()
    {
        $validated = request()->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'category' => 'required|string',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'message' => 'required|string|max:5000',
        ]);

        // TODO: Send email notification to support team
        // TODO: Store in database if needed
        // For now, just return success
        
        return back()->with('success', 'Your support request has been submitted. We\'ll respond within 24 hours.');
    }

    /**
     * Display a specific help article
     */
    public function article($category, $subcategory = null, $slug = null)
    {
        // If only 2 parameters, treat second as slug
        if ($slug === null && $subcategory !== null) {
            $slug = $subcategory;
            $subcategory = null;
        }

        // Build the component path
        $componentPath = 'Help/articles/' . $category;
        if ($subcategory) {
            $componentPath .= '/' . $subcategory;
        }
        
        // Convert slug to PascalCase for component name
        $componentName = str_replace(' ', '', ucwords(str_replace('-', ' ', $slug ?? '')));
        $fullPath = $componentPath . '/' . $componentName;

        return Inertia::render($fullPath);
    }
}
