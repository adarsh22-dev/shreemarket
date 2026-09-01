import { useContext } from 'react';
import { CompareContext } from '../context/CompareContextValues';

export const useCompare = () => useContext(CompareContext);