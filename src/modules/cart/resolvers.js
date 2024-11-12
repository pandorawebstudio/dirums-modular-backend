import { CartService } from './cart.service.js';

const cartService = new CartService();

export const cartResolvers = {
  Query: {
    cart: async (_, __, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return cartService.getCart(auth.user.id);
    }
  },

  Mutation: {
    addToCart: async (_, { item }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return cartService.addItem(auth.user.id, item);
    },

    updateCartItem: async (_, { itemId, input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return cartService.updateItem(auth.user.id, itemId, input);
    },

    removeFromCart: async (_, { itemId }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return cartService.removeItem(auth.user.id, itemId);
    },

    clearCart: async (_, __, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return cartService.clearCart(auth.user.id);
    },

    applyCoupon: async (_, { code }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return cartService.applyCoupon(auth.user.id, code);
    },

    removeCoupon: async (_, { code }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return cartService.removeCoupon(auth.user.id, code);
    }
  },

  Cart: {
    user: async (cart, _, { dataSources }) => {
      return dataSources.users.findById(cart.user);
    },
    items: async (cart, _, { dataSources }) => {
      return Promise.all(cart.items.map(async (item) => ({
        ...item,
        product: await dataSources.products.findById(item.product),
        variant: await dataSources.products.findVariantById(item.product, item.variant)
      })));
    }
  }
};