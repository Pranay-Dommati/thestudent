import React, { useState } from 'react';
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import CourseHero from "./CourseHero/CourseHero";
import CourseCategories from "./CourseCategories/CourseCategories";
import CourseFilters from "./CourseFilters/CourseFilters";
import CourseListings from "./CourseListings/CourseListings";

const Courses = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filters, setFilters] = useState({
        skillLevel: 'all',
        duration: 'all',
        sortBy: 'popular'
    });

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    const handleFilterChange = (newFilters) => {
        setFilters({...filters, ...newFilters});
    };

    return (
        <>
            <Navbar />
            <CourseHero />
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/4">
                        <CourseCategories 
                            selectedCategory={selectedCategory} 
                            onCategoryChange={handleCategoryChange} 
                        />
                        <CourseFilters 
                            filters={filters} 
                            onFilterChange={handleFilterChange} 
                        />
                    </div>
                    <div className="md:w-3/4">
                        <CourseListings 
                            category={selectedCategory}
                            filters={filters}
                        />
                    </div>
                </div>
            </div>
           <Footer />
        </>
    );
}

export default Courses;