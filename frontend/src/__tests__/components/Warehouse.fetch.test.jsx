
import { renderWithProviders } from '../helpers/test-utils';
import Warehouse from '../../components/Warehouse';

jest.mock('../../api', () => ({
  __esModule: true,
  getWarehouses: jest.fn(() => Promise.resolve({ data: [] })),
  getWarehouseItems: jest.fn(() => Promise.resolve({ data: [] })),
  createWarehouse: jest.fn(),
  updateWarehouse: jest.fn(),
  deleteWarehouse: jest.fn(),
  createWarehouseItem: jest.fn(),
  updateWarehouseItem: jest.fn(),
  deleteWarehouseItem: jest.fn()
}));

const api = require('../../api');

describe('Warehouse fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches warehouses and items once on mount', async () => {
    renderWithProviders(<Warehouse />);
    await new Promise(r => setTimeout(r, 20));
    expect(api.getWarehouses).toHaveBeenCalledTimes(1);
    expect(api.getWarehouseItems).toHaveBeenCalledTimes(1);
  });

  it('does not refetch on noop rerender', async () => {
    const { rerender } = renderWithProviders(<Warehouse />);
    await new Promise(r => setTimeout(r, 20));
    expect(api.getWarehouses).toHaveBeenCalledTimes(1);
    expect(api.getWarehouseItems).toHaveBeenCalledTimes(1);
    rerender(<Warehouse />);
    await new Promise(r => setTimeout(r, 20));
    expect(api.getWarehouses).toHaveBeenCalledTimes(1);
    expect(api.getWarehouseItems).toHaveBeenCalledTimes(1);
  });
});
