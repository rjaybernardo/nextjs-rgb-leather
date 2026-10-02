-- CreateIndex
CREATE INDEX "Cart_sessionCartId_idx" ON "Cart"("sessionCartId");

-- CreateIndex
CREATE INDEX "Cart_userId_idx" ON "Cart"("userId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
