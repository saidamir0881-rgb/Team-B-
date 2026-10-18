import { useEffect, useState, useCallback } from 'react';
import { api } from './api';
export function useData(path){const [data,setData]=useState(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [version,setVersion]=useState(0);const refresh=useCallback(()=>setVersion(v=>v+1),[]);useEffect(()=>{let active=true;setLoading(true);setError('');api(path).then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[path,version]);return {data,error,loading,refresh};}
