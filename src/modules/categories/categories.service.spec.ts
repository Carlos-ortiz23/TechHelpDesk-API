import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: Repository<Category>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCategoryDto = {
      name: 'Test Category',
      description: 'Test Description',
    };

    it('should create a category successfully', async () => {
      const mockCategory = {
        id: 'category-uuid',
        ...createCategoryDto,
        isActive: true,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockCategory);
      mockRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create(createCategoryDto);

      expect(result).toEqual(mockCategory);
      expect(mockRepository.create).toHaveBeenCalledWith(createCategoryDto);
    });

    it('should throw ConflictException when name already exists', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 'existing-category' });

      await expect(service.create(createCategoryDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Category 1' },
        { id: 'cat-2', name: 'Category 2' },
      ];

      mockRepository.find.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual(mockCategories);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('findAllActive', () => {
    it('should return only active categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Category 1', isActive: true },
      ];

      mockRepository.find.mockResolvedValue(mockCategories);

      const result = await service.findAllActive();

      expect(result).toEqual(mockCategories);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category when found', async () => {
      const mockCategory = {
        id: 'category-uuid',
        name: 'Test Category',
      };

      mockRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne('category-uuid');

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      const existingCategory = {
        id: 'category-uuid',
        name: 'Original Name',
      };

      const updateDto = { name: 'Updated Name' };

      mockRepository.findOne
        .mockResolvedValueOnce(existingCategory)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...existingCategory, ...updateDto });
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('category-uuid', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith('category-uuid', updateDto);
    });

    it('should throw ConflictException when updating to existing name', async () => {
      const existingCategory = {
        id: 'category-uuid',
        name: 'Original Name',
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingCategory)
        .mockResolvedValueOnce({ id: 'other-category', name: 'Taken Name' });

      await expect(
        service.update('category-uuid', { name: 'Taken Name' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove category successfully', async () => {
      const mockCategory = {
        id: 'category-uuid',
        name: 'Test Category',
      };

      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.remove.mockResolvedValue(mockCategory);

      await service.remove('category-uuid');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
