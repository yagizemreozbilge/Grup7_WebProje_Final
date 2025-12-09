const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error('Error:', err);

    // Prisma validation errors
    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            error: {
                code: 'CONFLICT',
                message: 'Bu kayıt zaten mevcut',
                details: [`${err.meta?.target?.join(', ') || 'Alan'} zaten kullanılıyor`]
            }
        });
    }

    // Prisma record not found
    if (err.code === 'P2025') {
        return res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'Kayıt bulunamadı',
                details: []
            }
        });
    }

    // Prisma foreign key constraint
    if (err.code === 'P2003') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Geçersiz referans',
                details: ['Referans edilen kayıt bulunamadı']
            }
        });
    }

    // Sequelize validation errors (backward compatibility)
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation error',
                details: err.errors.map(e => e.message)
            }
        });
    }

    // Sequelize unique constraint errors (backward compatibility)
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            success: false,
            error: {
                code: 'CONFLICT',
                message: 'Duplicate entry',
                details: err.errors.map(e => e.message)
            }
        });
    }

    // Sequelize foreign key errors (backward compatibility)
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid reference',
                details: ['Referenced record does not exist']
            }
        });
    }

    // Custom application errors
    if (err.message) {
        return res.status(statusCode).json({
            success: false,
            error: {
                code: err.code || 'BAD_REQUEST',
                message: err.message,
                details: err.details || []
            }
        });
    }

    // Default error
    res.status(statusCode).json({
        success: false,
        error: {
            code: statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' && err.stack ? [err.stack] : []
        }
    });
};

module.exports = errorHandler;