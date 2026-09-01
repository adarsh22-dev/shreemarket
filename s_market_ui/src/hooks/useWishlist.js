import { useContext } from 'react';
import { WishlistContext } from '../context/WishlistContextValues';

export const useWishlist = () => useContext(WishlistContext);