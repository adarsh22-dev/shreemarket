import { useContext } from 'react';
import { CartContext } from '../context/CartContextValues';

export const useCart = () => useContext(CartContext);