// src/hooks/useDJs.js
import { useState, useEffect, useCallback } from 'react';
import { getAllDJs, getAvailableDJs, getVerifiedDJs } from '../services/djService';

export const useDJs = (options = {}) => {
    const { autoFetch = true } = options;
    const [djs, setDjs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        showOnlyAvailable: false,
        showOnlyVerified: false,
        searchQuery: '',
        activeGenre: 'All',
        priceRange: { min: 0, max: 1000 },
        sortBy: 'rating'
    });

    const fetchDJs = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            let data;
            
            if (filters.showOnlyAvailable && filters.showOnlyVerified) {
                data = await getAllDJs({ verified_only: true, available_only: true });
                setDjs(data.djs || []);
            } else if (filters.showOnlyAvailable) {
                data = await getAvailableDJs();
                setDjs(data.available_djs || []);
            } else if (filters.showOnlyVerified) {
                data = await getVerifiedDJs();
                setDjs(data.verified_djs || []);
            } else {
                data = await getAllDJs();
                setDjs(data.djs || []);
            }
        } catch (err) {
            console.error("Error fetching DJs:", err);
            setError(err.message || "Failed to load DJs");
            setDjs([]);
        } finally {
            setLoading(false);
        }
    }, [filters.showOnlyAvailable, filters.showOnlyVerified]);

    useEffect(() => {
        if (autoFetch) {
            fetchDJs();
        }
    }, [fetchDJs, autoFetch]);

    const updateFilters = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const refresh = () => {
        fetchDJs();
    };

    const filteredDJs = djs.filter((dj) => {
        const matchesSearch = dj.name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
                              dj.genre?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                              (dj.tagline && dj.tagline.toLowerCase().includes(filters.searchQuery.toLowerCase()));
        const matchesGenre = filters.activeGenre === "All" || dj.genre === filters.activeGenre;
        const matchesPrice = (dj.price || 0) >= filters.priceRange.min && (dj.price || 0) <= filters.priceRange.max;
        return matchesSearch && matchesGenre && matchesPrice;
    }).sort((a, b) => {
        switch(filters.sortBy) {
            case "rating":
                return (b.rating || 0) - (a.rating || 0);
            case "price_low":
                return (a.price || 0) - (b.price || 0);
            case "price_high":
                return (b.price || 0) - (a.price || 0);
            case "name":
                return (a.name || "").localeCompare(b.name || "");
            default:
                return (b.rating || 0) - (a.rating || 0);
        }
    });

    return {
        djs: filteredDJs,
        allDJs: djs,
        loading,
        error,
        filters,
        updateFilters,
        refresh,
        totalCount: filteredDJs.length,
        originalCount: djs.length
    };
};