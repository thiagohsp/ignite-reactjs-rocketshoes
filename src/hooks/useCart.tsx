import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      // Valida se o item ja existe no carrinho
      const productExist = cart.find(item => item.id === productId);

      if (productExist) {
        await updateProductAmount({ productId, amount: productExist.amount + 1 });
        return;
      }

      const stock = await api.get<Stock>(`stock/${productId}`)
        .then(response => {
          return response.data?.amount
        });

      if (stock) {
        await api.get(`products/${productId}`)
          .then((response) => {
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(
              [...cart, { ...response.data, amount: 1 }]
            ));
            setCart([...cart, { ...response.data, amount: 1 }])
          });
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch {
      // TODO
      //toast.error();
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(item => item.id === productId);

      if (!product) {
        throw new Error();
      }

      // TODO
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(
        cart.filter(item => item.id !== productId)
      ));

      setCart(cart.filter(item => item.id !== productId))
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO

      const product = cart.find(item => item.id === productId);

      if (!product) {
        throw new Error();
      }

      const stock = await api.get(`stock/${productId}`)
        .then(response => {
          return response.data.amount
        });

      if (amount < 1 || amount > stock) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const updatedCart = cart.map(item => item.id === productId ? {
        ...item,
        amount
      } : item);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(
        updatedCart
      ));

      setCart(updatedCart);

    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
